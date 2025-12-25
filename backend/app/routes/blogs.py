"""
Blog Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import BlogPost, Comment, User

bp = Blueprint('blogs', __name__, url_prefix='/api/posts')


@bp.route('/', methods=['GET'])
def get_posts():
    """Get all posts with pagination"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    posts = BlogPost.query.order_by(BlogPost.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'success': True,
        'posts': [post.to_dict() for post in posts.items],
        'total': posts.total,
        'pages': posts.pages,
        'currentPage': page
    })


@bp.route('/random', methods=['GET'])
def get_random_posts():
    """Get random posts"""
    limit = request.args.get('limit', 10, type=int)
    
    # Use SQL random function
    posts = BlogPost.query.order_by(db.func.random()).limit(limit).all()
    
    return jsonify({
        'success': True,
        'posts': [post.to_dict() for post in posts]
    })


@bp.route('/<int:post_id>', methods=['GET'])
def get_post(post_id):
    """Get a specific post"""
    post = BlogPost.query.get(post_id)
    
    if not post:
        return jsonify({
            'success': False,
            'message': 'Post not found'
        }), 404
    
    return jsonify({
        'success': True,
        'post': post.to_dict()
    })


@bp.route('/', methods=['POST'])
@jwt_required()
def create_post():
    """Create a new post"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data.get('content'):
        return jsonify({
            'success': False,
            'message': 'Content is required'
        }), 400
    
    post = BlogPost(
        author_id=user_id,
        content=data.get('content'),
        location=data.get('location'),
        url=data.get('url'),
        photo=data.get('photo')
    )
    
    try:
        db.session.add(post)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Post created successfully',
            'post': post.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to create post'
        }), 500


@bp.route('/<int:post_id>', methods=['PUT'])
@jwt_required()
def update_post(post_id):
    """Update a post"""
    user_id = int(get_jwt_identity())
    post = BlogPost.query.get(post_id)
    
    if not post:
        return jsonify({
            'success': False,
            'message': 'Post not found'
        }), 404
    
    if post.author_id != user_id:
        return jsonify({
            'success': False,
            'message': 'You can only edit your own posts'
        }), 403
    
    data = request.get_json()
    
    if 'content' in data:
        post.content = data['content']
    if 'url' in data:
        post.url = data['url']
    if 'photo' in data:
        post.photo = data['photo']
    
    try:
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Post updated successfully',
            'post': post.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update post'
        }), 500


@bp.route('/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    """Delete a post"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    post = BlogPost.query.get(post_id)
    
    if not post:
        return jsonify({
            'success': False,
            'message': 'Post not found'
        }), 404
    
    if post.author_id != user_id and user.user_role != 'admin':
        return jsonify({
            'success': False,
            'message': 'You can only delete your own posts'
        }), 403
    
    try:
        db.session.delete(post)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Post deleted successfully'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to delete post'
        }), 500


@bp.route('/<int:post_id>/like', methods=['POST'])
@jwt_required()
def toggle_like(post_id):
    """Toggle like on a post"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    post = BlogPost.query.get(post_id)
    
    if not post:
        return jsonify({
            'success': False,
            'message': 'Post not found'
        }), 404
    
    try:
        if user in post.likes:
            post.likes.remove(user)
            liked = False
        else:
            post.likes.append(user)
            liked = True
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'liked': liked,
            'likes': [u.id for u in post.likes],
            'likesCount': len(post.likes)
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to toggle like'
        }), 500


@bp.route('/<int:post_id>/comments', methods=['GET'])
def get_comments(post_id):
    """Get comments for a post"""
    post = BlogPost.query.get(post_id)
    
    if not post:
        return jsonify({
            'success': False,
            'message': 'Post not found'
        }), 404
    
    comments = Comment.query.filter_by(post_id=post_id).order_by(
        Comment.created_at.asc()
    ).all()
    
    return jsonify({
        'success': True,
        'comments': [comment.to_dict() for comment in comments]
    })


@bp.route('/<int:post_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(post_id):
    """Add a comment to a post"""
    user_id = int(get_jwt_identity())
    post = BlogPost.query.get(post_id)
    
    if not post:
        return jsonify({
            'success': False,
            'message': 'Post not found'
        }), 404
    
    data = request.get_json()
    
    if not data.get('content'):
        return jsonify({
            'success': False,
            'message': 'Content is required'
        }), 400
    
    comment = Comment(
        post_id=post_id,
        author_id=user_id,
        content=data.get('content')
    )
    
    try:
        db.session.add(comment)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Comment added',
            'comment': comment.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to add comment'
        }), 500


@bp.route('/<int:post_id>/comments/<int:comment_id>', methods=['PUT'])
@jwt_required()
def update_comment(post_id, comment_id):
    """Update a comment"""
    user_id = int(get_jwt_identity())
    comment = Comment.query.filter_by(id=comment_id, post_id=post_id).first()
    
    if not comment:
        return jsonify({
            'success': False,
            'message': 'Comment not found'
        }), 404
    
    if comment.author_id != user_id:
        return jsonify({
            'success': False,
            'message': 'You can only edit your own comments'
        }), 403
    
    data = request.get_json()
    comment.content = data.get('content', comment.content)
    
    try:
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Comment updated',
            'comment': comment.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update comment'
        }), 500


@bp.route('/<int:post_id>/comments/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment(post_id, comment_id):
    """Delete a comment"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    comment = Comment.query.filter_by(id=comment_id, post_id=post_id).first()
    
    if not comment:
        return jsonify({
            'success': False,
            'message': 'Comment not found'
        }), 404
    
    if comment.author_id != user_id and user.user_role != 'admin':
        return jsonify({
            'success': False,
            'message': 'You can only delete your own comments'
        }), 403
    
    try:
        db.session.delete(comment)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Comment deleted'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to delete comment'
        }), 500


@bp.route('/<int:post_id>/repost', methods=['POST'])
@jwt_required()
def repost(post_id):
    """Repost a post"""
    user_id = int(get_jwt_identity())
    original_post = BlogPost.query.get(post_id)
    
    if not original_post:
        return jsonify({
            'success': False,
            'message': 'Post not found'
        }), 404
    
    data = request.get_json()
    
    repost = BlogPost(
        author_id=user_id,
        content=data.get('content', ''),
        original_post_id=post_id
    )
    
    try:
        db.session.add(repost)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Post reposted successfully',
            'post': repost.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to repost'
        }), 500


@bp.route('/user/<int:user_id>', methods=['GET'])
def get_user_posts(user_id):
    """Get all posts by a specific user"""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    posts = BlogPost.query.filter_by(author_id=user_id).order_by(
        BlogPost.created_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'success': True,
        'posts': [post.to_dict() for post in posts.items],
        'total': posts.total,
        'pages': posts.pages,
        'currentPage': page
    })
