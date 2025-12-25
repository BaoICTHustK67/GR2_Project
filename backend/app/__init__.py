"""
Flask Application Factory
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

from config import config

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


def create_app(config_name='development'):
    """Application factory function"""
    app = Flask(__name__)
    
    # Disable strict slashes to prevent 308 redirects that strip auth headers
    app.url_map.strict_slashes = False
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'success': False,
            'message': 'Token has expired',
            'error': 'token_expired'
        }), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        print(f"[DEBUG] Invalid token error: {error}")
        return jsonify({
            'success': False,
            'message': f'Invalid token: {error}',
            'error': 'invalid_token'
        }), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        print(f"[DEBUG] Unauthorized error: {error}")
        return jsonify({
            'success': False,
            'message': f'Authorization token is missing: {error}',
            'error': 'authorization_required'
        }), 401
    
    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'success': False,
            'message': 'Token has been revoked',
            'error': 'token_revoked'
        }), 401
    
    # Enable CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:5173", "http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    
    # Debug: Log incoming requests
    @app.before_request
    def log_request():
        auth_header = request.headers.get('Authorization', 'No Auth Header')
        print(f"[DEBUG] {request.method} {request.path} - Auth: {auth_header[:50] if auth_header else 'None'}...")
    
    # Register blueprints
    from app.routes import auth, users, jobs, blogs, companies, interviews
    
    app.register_blueprint(auth.bp)
    app.register_blueprint(users.bp)
    app.register_blueprint(jobs.bp)
    app.register_blueprint(blogs.bp)
    app.register_blueprint(companies.bp)
    app.register_blueprint(interviews.bp)
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    # Health check route
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'message': 'HustConnect API is running'}
    
    return app
