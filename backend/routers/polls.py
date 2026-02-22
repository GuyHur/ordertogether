from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from core.deps import DB, CurrentUser
from models.poll import Poll, PollOption, PollVote
from models.activity import Activity
from schemas.poll import PollCreate, PollRead

router = APIRouter(prefix="/api/polls", tags=["polls"])

async def _get_poll(db, poll_id: str):
    return await db.execute(
        select(Poll)
        .options(
            selectinload(Poll.creator), 
            selectinload(Poll.options).selectinload(PollOption.service), 
            selectinload(Poll.votes).selectinload(PollVote.user)
        )
        .where(Poll.id == poll_id)
    )

@router.post("", response_model=PollRead, status_code=status.HTTP_201_CREATED)
async def create_poll(db: DB, user: CurrentUser, payload: PollCreate):
    poll = Poll(
        creator_id=user.id,
        title=payload.title,
        building=payload.building,
        destination=payload.destination,
        status="active"
    )
    db.add(poll)
    await db.flush()

    for opt in payload.options:
        db.add(PollOption(
            poll_id=poll.id,
            service_id=opt.service_id,
            text=opt.text
        ))

    # Activity
    db.add(Activity(
        user_id=user.id,
        message=f"started a poll: '{poll.title}'"
    ))

    await db.commit()
    
    # Reload with options and relationships
    res = await _get_poll(db, poll.id)
    return res.scalar_one()

@router.get("", response_model=list[PollRead])
async def list_polls(db: DB):
    res = await db.execute(
        select(Poll)
        .options(
            selectinload(Poll.creator), 
            selectinload(Poll.options).selectinload(PollOption.service), 
            selectinload(Poll.votes).selectinload(PollVote.user)
        )
        .where(Poll.status == "active")
        .order_by(Poll.created_at.desc())
    )
    return res.scalars().all()

@router.get("/{poll_id}", response_model=PollRead)
async def get_poll(db: DB, poll_id: str):
    res = await _get_poll(db, poll_id)
    poll = res.scalar_one_or_none()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    return poll

@router.post("/{poll_id}/vote", response_model=PollRead)
async def vote_poll(db: DB, user: CurrentUser, poll_id: str, payload: dict):
    option_id = payload.get("option_id")
    if not option_id:
        raise HTTPException(status_code=400, detail="option_id required")
    
    res = await _get_poll(db, poll_id)
    poll = res.scalar_one_or_none()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    if poll.status != "active":
        raise HTTPException(status_code=400, detail="Poll is closed")

    # verify option exists
    opt_res = await db.execute(select(PollOption).where(PollOption.id == option_id, PollOption.poll_id == poll_id))
    if not opt_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Option not found")

    # Upsert vote
    vote_res = await db.execute(select(PollVote).where(PollVote.poll_id == poll_id, PollVote.user_id == user.id))
    vote = vote_res.scalar_one_or_none()
    
    if vote:
        vote.option_id = option_id
    else:
        vote = PollVote(poll_id=poll_id, option_id=option_id, user_id=user.id)
        db.add(vote)
        
    await db.commit()
    
    # reload
    res = await _get_poll(db, poll_id)
    return res.scalar_one()

@router.post("/{poll_id}/close", response_model=PollRead)
async def close_poll(db: DB, user: CurrentUser, poll_id: str):
    res = await _get_poll(db, poll_id)
    poll = res.scalar_one_or_none()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    if poll.creator_id != user.id:
        raise HTTPException(status_code=403, detail="Only creator can close the poll")

    poll.status = "closed"
    await db.commit()
    
    res = await _get_poll(db, poll_id)
    return res.scalar_one()
