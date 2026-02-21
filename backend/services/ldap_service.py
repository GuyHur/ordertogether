"""LDAP authentication and user sync for Windows domain / Active Directory."""

from __future__ import annotations

from ldap3 import Connection, Server, SUBTREE
from ldap3.core.exceptions import LDAPException

from core.config import settings


def _server() -> Server:
    return Server(settings.LDAP_URL, get_info=None)


def authenticate_ldap(login: str, password: str) -> dict | None:
    """
    Authenticate a user against the LDAP server (e.g. Active Directory).
    login: email (userPrincipalName) or Windows username (sAMAccountName).
    password: user's password.

    Returns dict with email, display_name if auth succeeds, else None.
    """
    if not settings.LDAP_ENABLED or not login or not password:
        return None

    server = _server()
    base_dn = settings.LDAP_BASE_DN
    search_attr = settings.LDAP_USER_SEARCH_ATTRIBUTE
    alt_attr = (settings.LDAP_USER_SEARCH_ATTRIBUTE_ALT or "").strip()
    search_filter = settings.LDAP_USER_SEARCH_FILTER
    escaped = _escape_ldap(login)

    if alt_attr and alt_attr != search_attr:
        user_filter = f"(&{search_filter}(|({search_attr}={escaped})({alt_attr}={escaped})))"
    else:
        user_filter = f"(&{search_filter}({search_attr}={escaped}))"

    try:
        # Bind with service account to search (or anonymous if no bind DN)
        conn = Connection(
            server,
            user=settings.LDAP_BIND_DN or None,
            password=settings.LDAP_BIND_PASSWORD or None,
            auto_bind=True,
        )

        conn.search(
            search_base=base_dn,
            search_filter=user_filter,
            search_scope=SUBTREE,
            attributes=["userPrincipalName", "sAMAccountName", "mail", "displayName", "cn"],
        )

        if not conn.entries:
            conn.unbind()
            return None

        entry = conn.entries[0]
        user_dn = entry.entry_dn

        # Verify password by binding as the user
        user_conn = Connection(server, user=user_dn, password=password, auto_bind=True)
        user_conn.unbind()

        # Resolve email and display name from AD attributes (may be single or multi-value)
        def _first(attr):
            if attr is None:
                return None
            v = attr if not isinstance(attr, (list, tuple)) else (attr[0] if attr else None)
            return str(v).strip() if v else None

        upn = _first(getattr(entry, "userPrincipalName", None))
        mail = _first(getattr(entry, "mail", None))
        sam = _first(getattr(entry, "sAMAccountName", None))
        display_name = (
            _first(getattr(entry, "displayName", None))
            or _first(getattr(entry, "cn", None))
            or sam
            or upn
            or mail
            or "User"
        )
        email = upn or mail or (f"{sam}@local" if sam else "user@local")

        return {"email": email, "display_name": display_name}
    except LDAPException:
        return None


def _escape_ldap(value: str) -> str:
    """Escape a value for safe use in LDAP filter."""
    return value.replace("\\", "\\5c").replace("*", "\\2a").replace("(", "\\28").replace(")", "\\29").replace("\x00", "\\00")
