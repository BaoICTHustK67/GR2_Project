from flask_socketio import emit, join_room, leave_room
from flask_jwt_extended import decode_token
from flask import request
from app import socketio

@socketio.on('connect')
def handle_connect():
    print(f'[Socket] Client connected: {request.sid}')

@socketio.on('disconnect')
def handle_disconnect():
    print(f'[Socket] Client disconnected: {request.sid}')

@socketio.on('join')
def on_join(data):
    """
    User joins a conversation room.
    Expects data: {'conversationId': 123}
    """
    conversation_id = data.get('conversationId')
    if conversation_id:
        room = f"conversation_{conversation_id}"
        join_room(room)
        print(f'[Socket] Client {request.sid} joined room: {room}')

@socketio.on('leave')
def on_leave(data):
    """
    User leaves a conversation room.
    Expects data: {'conversationId': 123}
    """
    conversation_id = data.get('conversationId')
    if conversation_id:
        room = f"conversation_{conversation_id}"
        leave_room(room)
        print(f'[Socket] Client {request.sid} left room: {room}')
