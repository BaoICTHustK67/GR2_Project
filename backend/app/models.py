"""
Database Models
"""
from datetime import datetime
from app import db
from werkzeug.security import generate_password_hash, check_password_hash


# Association tables for many-to-many relationships
post_likes = db.Table('post_likes',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('post_id', db.Integer, db.ForeignKey('blog_posts.id'), primary_key=True)
)

user_connections = db.Table('user_connections',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('connected_user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('status', db.String(20), default='pending'),  # pending, accepted, rejected
    db.Column('created_at', db.DateTime, default=datetime.utcnow)
)

company_followers = db.Table('company_followers',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('company_id', db.Integer, db.ForeignKey('companies.id'), primary_key=True)
)


class User(db.Model):
    """User model"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    user_role = db.Column(db.String(20), default='normal')  # normal, hr, admin
    status = db.Column(db.String(20), default='active')  # active, deactivated
    image = db.Column(db.String(500), default='/profile.svg')
    cover_image = db.Column(db.String(500), default='/cover.jpg')
    bio = db.Column(db.Text)
    location = db.Column(db.String(100))
    headline = db.Column(db.String(200))
    dark_mode = db.Column(db.Boolean, default=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    posts = db.relationship('BlogPost', backref='author', lazy='dynamic', foreign_keys='BlogPost.author_id')
    comments = db.relationship('Comment', backref='author', lazy='dynamic')
    educations = db.relationship('Education', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    experiences = db.relationship('Experience', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    skills = db.relationship('Skill', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    projects = db.relationship('Project', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    applications = db.relationship('Application', backref='applicant', lazy='dynamic')
    interviews = db.relationship('Interview', backref='user', lazy='dynamic')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self, include_private=False):
        data = {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'userRole': self.user_role,
            'status': self.status,
            'image': self.image,
            'coverImage': self.cover_image,
            'bio': self.bio,
            'location': self.location,
            'headline': self.headline,
            'darkMode': self.dark_mode,
            'companyId': self.company_id,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }
        return data


class Company(db.Model):
    """Company model"""
    __tablename__ = 'companies'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    logo = db.Column(db.String(500))
    website = db.Column(db.String(500))
    industry = db.Column(db.String(100))
    size = db.Column(db.String(50))  # 1-10, 11-50, 51-200, 201-500, 500+
    location = db.Column(db.String(200))
    founded = db.Column(db.Integer)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Admin/creator of the company
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    jobs = db.relationship('Job', backref='company', lazy='dynamic')
    hr_members = db.relationship('User', backref='company', lazy='dynamic', foreign_keys='User.company_id')
    followers = db.relationship('User', secondary=company_followers, backref='followed_companies')
    join_requests = db.relationship('CompanyJoinRequest', backref='company', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self, include_hr_count=False):
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'logo': self.logo,
            'website': self.website,
            'industry': self.industry,
            'size': self.size,
            'location': self.location,
            'founded': self.founded,
            'createdBy': self.created_by,
            'followersCount': len(self.followers),
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }
        if include_hr_count:
            data['hrCount'] = self.hr_members.count()
        return data


class CompanyJoinRequest(db.Model):
    """Join request for HR users to join a company"""
    __tablename__ = 'company_join_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    message = db.Column(db.Text)  # Optional message from requester
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    requester = db.relationship('User', foreign_keys=[user_id], backref='join_requests')
    reviewer = db.relationship('User', foreign_keys=[reviewed_by])
    
    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'companyId': self.company_id,
            'status': self.status,
            'message': self.message,
            'reviewedBy': self.reviewed_by,
            'reviewedAt': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'requester': self.requester.to_dict() if self.requester else None,
            'company': self.company.to_dict() if self.company else None,
        }


class Job(db.Model):
    """Job posting model"""
    __tablename__ = 'jobs'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    location = db.Column(db.String(200))
    job_type = db.Column(db.String(50))  # full-time, part-time, contract, internship
    experience_level = db.Column(db.String(50))  # entry, mid, senior
    salary_min = db.Column(db.Integer)
    salary_max = db.Column(db.Integer)
    responsibilities = db.Column(db.JSON, default=list)
    requirements = db.Column(db.JSON, default=list)
    benefits = db.Column(db.JSON, default=list)
    status = db.Column(db.String(20), default='published')  # draft, published, closed
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    applications = db.relationship('Application', backref='job', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'location': self.location,
            'jobType': self.job_type,
            'experienceLevel': self.experience_level,
            'salaryMin': self.salary_min,
            'salaryMax': self.salary_max,
            'responsibilities': self.responsibilities or [],
            'requirements': self.requirements or [],
            'benefits': self.benefits or [],
            'status': self.status,
            'company': self.company.to_dict() if self.company else None,
            'applicantCount': self.applications.count(),
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'postedDate': self.created_at.isoformat() if self.created_at else None,
        }


class Application(db.Model):
    """Job application model"""
    __tablename__ = 'applications'
    
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20))
    cv_link = db.Column(db.String(500))
    cover_letter = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending')  # pending, reviewed, accepted, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'jobId': self.job_id,
            'userId': self.user_id,
            'fullName': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'cvLink': self.cv_link,
            'coverLetter': self.cover_letter,
            'status': self.status,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'job': self.job.to_dict() if self.job else None,
            'applicant': self.applicant.to_dict() if self.applicant else None,
        }


class BlogPost(db.Model):
    """Blog post model"""
    __tablename__ = 'blog_posts'
    
    id = db.Column(db.Integer, primary_key=True)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    location = db.Column(db.String(100))
    url = db.Column(db.String(500))
    photo = db.Column(db.String(500))
    original_post_id = db.Column(db.Integer, db.ForeignKey('blog_posts.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    comments = db.relationship('Comment', backref='post', lazy='dynamic', cascade='all, delete-orphan')
    likes = db.relationship('User', secondary=post_likes, backref='liked_posts')
    reposts = db.relationship('BlogPost', backref=db.backref('original_post', remote_side=[id]), lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'author': self.author.to_dict() if self.author else None,
            'content': self.content,
            'location': self.location,
            'url': self.url,
            'photo': self.photo,
            'likes': [user.id for user in self.likes],
            'likesCount': len(self.likes),
            'commentsCount': self.comments.count(),
            'comments': [comment.to_dict() for comment in self.comments.order_by(Comment.created_at.asc())],
            'repostsCount': self.reposts.count(),
            'originalPost': self.original_post.to_dict() if self.original_post else None,
            'timestamp': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'createdAt': self.created_at.isoformat() + 'Z' if self.created_at else None,
        }


class Comment(db.Model):
    """Comment model for blog posts"""
    __tablename__ = 'comments'
    
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('blog_posts.id'), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'postId': self.post_id,
            'author': self.author.to_dict() if self.author else None,
            'content': self.content,
            'timestamp': self.created_at.isoformat() + 'Z' if self.created_at else None,
        }


class Interview(db.Model):
    """Interview model"""
    __tablename__ = 'interviews'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=True)
    role = db.Column(db.String(200), nullable=False)
    interview_type = db.Column(db.String(50))  # behavioral, technical, mixed
    tech_stack = db.Column(db.JSON, default=list)
    questions = db.Column(db.JSON, default=list)
    cover_image = db.Column(db.String(500))
    finalized = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    feedback = db.relationship('Feedback', backref='interview', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'jobId': self.job_id,
            'role': self.role,
            'type': self.interview_type,
            'techstack': self.tech_stack or [],
            'questions': self.questions or [],
            'coverImage': self.cover_image,
            'finalized': self.finalized,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class Feedback(db.Model):
    """Interview feedback model"""
    __tablename__ = 'feedback'
    
    id = db.Column(db.Integer, primary_key=True)
    interview_id = db.Column(db.Integer, db.ForeignKey('interviews.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    total_score = db.Column(db.Integer)
    category_scores = db.Column(db.JSON, default=dict)
    strengths = db.Column(db.JSON, default=list)
    areas_for_improvement = db.Column(db.JSON, default=list)
    final_assessment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'interviewId': self.interview_id,
            'userId': self.user_id,
            'totalScore': self.total_score,
            'categoryScores': self.category_scores or {},
            'strengths': self.strengths or [],
            'areasForImprovement': self.areas_for_improvement or [],
            'finalAssessment': self.final_assessment,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class Education(db.Model):
    """User education model"""
    __tablename__ = 'educations'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    school = db.Column(db.String(200), nullable=False)
    degree = db.Column(db.String(100))
    field_of_study = db.Column(db.String(100))
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    description = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id': self.id,
            'school': self.school,
            'degree': self.degree,
            'fieldOfStudy': self.field_of_study,
            'startDate': self.start_date.isoformat() if self.start_date else None,
            'endDate': self.end_date.isoformat() if self.end_date else None,
            'description': self.description,
        }


class Experience(db.Model):
    """User work experience model"""
    __tablename__ = 'experiences'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    company = db.Column(db.String(200), nullable=False)
    location = db.Column(db.String(100))
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    is_current = db.Column(db.Boolean, default=False)
    description = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'company': self.company,
            'location': self.location,
            'startDate': self.start_date.isoformat() if self.start_date else None,
            'endDate': self.end_date.isoformat() if self.end_date else None,
            'isCurrent': self.is_current,
            'description': self.description,
        }


class Skill(db.Model):
    """User skill model"""
    __tablename__ = 'skills'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    level = db.Column(db.String(50))  # beginner, intermediate, advanced, expert
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'level': self.level,
        }


class Project(db.Model):
    """User project model"""
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    url = db.Column(db.String(500))
    technologies = db.Column(db.JSON, default=list)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'url': self.url,
            'technologies': self.technologies or [],
            'startDate': self.start_date.isoformat() if self.start_date else None,
            'endDate': self.end_date.isoformat() if self.end_date else None,
        }
