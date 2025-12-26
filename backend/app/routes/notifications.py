"""
Notifications Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Notification, User

bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')


@bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get all notifications for the current user"""
    user_id = int(get_jwt_identity())
    
    # Get query params
    unread_only = request.args.get('unread', 'false').lower() == 'true'
    limit = request.args.get('limit', 50, type=int)
    
    query = Notification.query.filter_by(user_id=user_id)
    
    if unread_only:
        query = query.filter_by(is_read=False)
    
    notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()
    
    # Get unread count
    unread_count = Notification.query.filter_by(user_id=user_id, is_read=False).count()
    
    return jsonify({
        'success': True,
        'notifications': [n.to_dict() for n in notifications],
        'unreadCount': unread_count
    })


@bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Get the count of unread notifications"""
    user_id = int(get_jwt_identity())
    
    count = Notification.query.filter_by(user_id=user_id, is_read=False).count()
    
    return jsonify({
        'success': True,
        'count': count
    })


@bp.route('/<int:notification_id>/read', methods=['POST'])
@jwt_required()
def mark_as_read(notification_id):
    """Mark a notification as read"""
    user_id = int(get_jwt_identity())
    
    notification = Notification.query.get(notification_id)
    
    if not notification:
        return jsonify({
            'success': False,
            'message': 'Notification not found'
        }), 404
    
    if notification.user_id != user_id:
        return jsonify({
            'success': False,
            'message': 'You do not have permission to update this notification'
        }), 403
    
    notification.is_read = True
    
    try:
        db.session.commit()
        return jsonify({
            'success': True,
            'notification': notification.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to mark notification as read'
        }), 500


@bp.route('/mark-all-read', methods=['POST'])
@jwt_required()
def mark_all_as_read():
    """Mark all notifications as read for the current user"""
    user_id = int(get_jwt_identity())
    
    try:
        Notification.query.filter_by(user_id=user_id, is_read=False).update({'is_read': True})
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'All notifications marked as read'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to mark notifications as read'
        }), 500


@bp.route('/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Delete a notification"""
    user_id = int(get_jwt_identity())
    
    notification = Notification.query.get(notification_id)
    
    if not notification:
        return jsonify({
            'success': False,
            'message': 'Notification not found'
        }), 404
    
    if notification.user_id != user_id:
        return jsonify({
            'success': False,
            'message': 'You do not have permission to delete this notification'
        }), 403
    
    try:
        db.session.delete(notification)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Notification deleted'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to delete notification'
        }), 500


def create_notification(user_id: int, notification_type: str, title: str, message: str, link: str = None, data: dict = None):
    """Helper function to create a notification"""
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        link=link,
        data=data
    )
    db.session.add(notification)
    return notification


def notify_company_followers_new_job(company, job):
    """Notify all followers of a company about a new job posting"""
    for follower in company.followers:
        create_notification(
            user_id=follower.id,
            notification_type='new_job',
            title=f'New job at {company.name}',
            message=f'{company.name} posted a new position: {job.title}',
            link=f'/jobs/{job.id}',
            data={
                'companyId': company.id,
                'companyName': company.name,
                'jobId': job.id,
                'jobTitle': job.title
            }
        )


def notify_application_status_change(application, old_status, new_status):
    """Notify applicant when their application status changes"""
    job = application.job
    company = job.company
    
    status_messages = {
        'reviewed': f'Your application for {job.title} at {company.name if company else "the company"} is being reviewed',
        'accepted': f'Congratulations! Your application for {job.title} at {company.name if company else "the company"} has been accepted',
        'rejected': f'Your application for {job.title} at {company.name if company else "the company"} was not selected'
    }
    
    message = status_messages.get(new_status, f'Your application status has been updated to {new_status}')
    
    create_notification(
        user_id=application.user_id,
        notification_type='application_status',
        title=f'Application Update: {job.title}',
        message=message,
        link=f'/jobs/{job.id}',
        data={
            'applicationId': application.id,
            'jobId': job.id,
            'jobTitle': job.title,
            'companyId': company.id if company else None,
            'companyName': company.name if company else None,
            'oldStatus': old_status,
            'newStatus': new_status
        }
    )
