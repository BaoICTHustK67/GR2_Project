"""
Message routes for handling conversations and messages
"""
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from flask import Blueprint
from app.models import Conversation, Message, User, user_connections
from sqlalchemy import or_, and_
from app import socketio

bp = Blueprint('messages', __name__, url_prefix='/api')

@bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    """Get all conversations for current user"""
    user_id = int(get_jwt_identity())
    
    # Get all conversations where user is a participant
    conversations = Conversation.query.join(
        Conversation.participants
    ).filter(
        User.id == user_id
    ).order_by(
        Conversation.updated_at.desc()
    ).all()
    
    return jsonify({
        'success': True,
        'conversations': [conv.to_dict(user_id) for conv in conversations]
    })

@bp.route('/conversations', methods=['POST'])
@jwt_required()
def create_conversation():
    """Create a new conversation or return existing one"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    # Check if we have participant IDs
    if not data or 'participantIds' not in data or not isinstance(data['participantIds'], list):
        return jsonify({'success': False, 'message': 'Invalid participant IDs'}), 400
    
    participant_ids = [int(pid) for pid in data['participantIds'] if int(pid) != user_id]
    
    # For 1:1 chats, check if conversation already exists
    if len(participant_ids) == 1:
        other_user_id = participant_ids[0]
        
        # Find conversation where both users are participants and total participants is 2
        # We use a subquery approach for better compatibility
        
        # Find conversations shared by both users
        shared_convs = db.session.query(Conversation.id)\
            .join(Conversation.participants)\
            .filter(User.id.in_([user_id, other_user_id]))\
            .group_by(Conversation.id)\
            .having(db.func.count(User.id) == 2)\
            .all()
            
        # Filter for conversations with EXACTLY 2 participants (to avoid group chats with these 2)
        target_conv_id = None
        for conv_id_tuple in shared_convs:
            conv_id = conv_id_tuple[0]
            
            # Re-fetching to be safe and simple
            conv = Conversation.query.get(conv_id)
            if conv.participants and len(conv.participants) == 2:
                target_conv_id = conv_id
                break
        
        if target_conv_id:
            existing = Conversation.query.get(target_conv_id)
            return jsonify({
                'success': True,
                'conversation': existing.to_dict(user_id),
                'isNew': False
            })
    
    # Create new conversation
    conversation = Conversation()
    
    # Add participants
    participants = User.query.filter(User.id.in_(participant_ids + [user_id])).all()
    conversation.participants = participants
    
    db.session.add(conversation)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'conversation': conversation.to_dict(user_id),
        'isNew': True
    })

@bp.route('/conversations/<int:conversation_id>', methods=['GET'])
@jwt_required()
def get_conversation(conversation_id):
    """Get a specific conversation with its messages"""
    user_id = int(get_jwt_identity())
    
    conversation = Conversation.query.get_or_404(conversation_id)
    
    # Check if user is a participant
    if user_id not in [p.id for p in conversation.participants]:
        return jsonify({'success': False, 'message': 'Not authorized'}), 403
    
    # Mark messages as read
    conversation.messages.filter(
        Message.sender_id != user_id,
        Message.is_read == False
    ).update({'is_read': True}, synchronize_session=False)
    
    db.session.commit()
    
    # Get messages with pagination
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 50)
    
    messages = conversation.messages.order_by(
        Message.created_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'success': True,
        'conversation': conversation.to_dict(user_id),
        'messages': {
            'items': [msg.to_dict() for msg in messages.items],
            'page': messages.page,
            'per_page': messages.per_page,
            'total': messages.total,
            'pages': messages.pages
        }
    })

@bp.route('/conversations/<int:conversation_id>/messages', methods=['POST'])
@jwt_required()
def send_message(conversation_id):
    """Send a message in a conversation"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data or 'content' not in data or not data['content'].strip():
        return jsonify({'success': False, 'message': 'Message content is required'}), 400
    
    conversation = Conversation.query.get_or_404(conversation_id)
    
    # Check if user is a participant
    if user_id not in [p.id for p in conversation.participants]:
        return jsonify({'success': False, 'message': 'Not authorized'}), 403
    
    # Create and save message
    message = Message(
        conversation_id=conversation_id,
        sender_id=user_id,
        content=data['content'].strip()
    )
    
    # Update conversation's updated_at
    conversation.updated_at = db.func.now()
    
    db.session.add(message)
    db.session.commit()
    
    # Emit WebSocket event for real-time updates
    socketio.emit('new_message', {
        'conversationId': conversation_id,
        'message': message.to_dict()
    }, room=f"conversation_{conversation_id}")
    
    return jsonify({
        'success': True,
        'message': message.to_dict()
    })

@bp.route('/connections', methods=['GET'])
@jwt_required()
def get_connections():
    """Get user's connections"""
    user_id = int(get_jwt_identity())
    
    # Get users who have an accepted connection with current user
    connections = db.session.query(User).join(
        user_connections,
        and_(
            or_(
                user_connections.c.user_id == User.id,
                user_connections.c.connected_user_id == User.id
            ),
            or_(
                user_connections.c.user_id == user_id,
                user_connections.c.connected_user_id == user_id
            ),
            user_connections.c.status == 'accepted'
        )
    ).filter(User.id != user_id).all()
    
    return jsonify({
        'success': True,
        'connections': [user.to_dict() for user in connections]
    })

@bp.route('/connections/requests', methods=['GET'])
@jwt_required()
def get_connection_requests():
    """Get pending connection requests"""
    user_id = int(get_jwt_identity())
    
    # Get users who have sent connection requests to current user
    requests = db.session.query(User).join(
        user_connections,
        and_(
            user_connections.c.connected_user_id == user_id,
            user_connections.c.user_id == User.id,
            user_connections.c.status == 'pending'
        )
    ).all()
    
    return jsonify({
        'success': True,
        'requests': [user.to_dict() for user in requests]
    })

@bp.route('/connections/<int:user_id>', methods=['POST'])
@jwt_required()
def send_connection_request(user_id):
    """Send a connection request to another user"""
    current_user_id = int(get_jwt_identity())
    
    if current_user_id == user_id:
        return jsonify({'success': False, 'message': 'Cannot send request to yourself'}), 400
    
    # Check if user exists
    user = User.query.get_or_404(user_id)
    
    # Check if connection already exists or is pending
    existing = db.session.query(user_connections).filter(
        or_(
            and_(
                user_connections.c.user_id == current_user_id,
                user_connections.c.connected_user_id == user_id
            ),
            and_(
                user_connections.c.user_id == user_id,
                user_connections.c.connected_user_id == current_user_id
            )
        )
    ).first()
    
    if existing:
        if existing.status == 'pending':
            return jsonify({'success': False, 'message': 'Connection request already sent'}), 400
        return jsonify({'success': False, 'message': 'Already connected'}), 400
    
    # Create connection request
    stmt = user_connections.insert().values(
        user_id=current_user_id,
        connected_user_id=user_id,
        status='pending'
    )
    db.session.execute(stmt)
    
    # TODO: Create notification for the recipient
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Connection request sent'
    })

@bp.route('/connections/<int:user_id>', methods=['PUT'])
@jwt_required()
def respond_to_connection_request(user_id):
    """Respond to a connection request (accept/reject)"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data or 'action' not in data or data['action'] not in ['accept', 'reject']:
        return jsonify({'success': False, 'message': 'Invalid action'}), 400
    
    # Find the connection request
    stmt = user_connections.update().where(
        and_(
            user_connections.c.user_id == user_id,
            user_connections.c.connected_user_id == current_user_id,
            user_connections.c.status == 'pending'
        )
    ).values(
        status='accepted' if data['action'] == 'accept' else 'rejected',
        reviewed_by=current_user_id,
        reviewed_at=db.func.now()
    )
    
    result = db.session.execute(stmt)
    
    if result.rowcount == 0:
        return jsonify({'success': False, 'message': 'No pending request found'}), 404
    
    db.session.commit()
    
    # TODO: Create notification for the requester
    
    return jsonify({
        'success': True,
        'message': f'Connection request {data["action"]}ed'
    })

@bp.route('/connections/<int:user_id>', methods=['DELETE'])
@jwt_required()
def remove_connection(user_id):
    """Remove a connection"""
    current_user_id = int(get_jwt_identity())
    
    # Delete the connection in both directions
    stmt = user_connections.delete().where(
        or_(
            and_(
                user_connections.c.user_id == current_user_id,
                user_connections.c.connected_user_id == user_id
            ),
            and_(
                user_connections.c.user_id == user_id,
                user_connections.c.connected_user_id == current_user_id
            )
        )
    )
    
    result = db.session.execute(stmt)
    
    if result.rowcount == 0:
        return jsonify({'success': False, 'message': 'No connection found'}), 404
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Connection removed'
    })
