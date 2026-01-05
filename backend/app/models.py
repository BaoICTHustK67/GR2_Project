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
    db.Column('created_at', db.DateTime, default=datetime.utcnow),
    db.Column('reviewed_by', db.Integer, db.ForeignKey('users.id'), nullable=True),
    db.Column('reviewed_at', db.DateTime, nullable=True)
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
    phone = db.Column(db.String(20))
    website = db.Column(db.String(500))
    linkedin = db.Column(db.String(500))
    github = db.Column(db.String(500))
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
            'phone': self.phone,
            'website': self.website,
            'linkedin': self.linkedin,
            'github': self.github,
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
            'createdAt': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'job': self.job.to_dict() if self.job else None,
            'applicant': self.applicant.to_dict() if self.applicant else None,
        }


class Notification(db.Model):
    """Notification model for user notifications"""
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # new_job, application_status, etc.
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    link = db.Column(db.String(500))  # Link to navigate when clicked
    is_read = db.Column(db.Boolean, default=False)
    data = db.Column(db.JSON)  # Additional data (job_id, company_id, etc.)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref=db.backref('notifications', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'link': self.link,
            'isRead': self.is_read,
            'data': self.data,
            'createdAt': self.created_at.isoformat() + 'Z' if self.created_at else None,
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

class Conversation(db.Model):
    """Conversation model"""
    __tablename__ = 'conversations'

    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    participants = db.relationship('User', secondary='conversation_participants', backref='conversations')
    messages = db.relationship('Message', backref='conversation', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self, current_user_id):
        other_participant = None
        for p in self.participants:
            if p.id != current_user_id:
                other_participant = p
                break

        last_message = self.messages.order_by(Message.created_at.desc()).first()

        return {
            'id': self.id,
            'participants': [p.to_dict() for p in self.participants],
            'otherParticipant': other_participant.to_dict() if other_participant else None,
            'lastMessage': last_message.to_dict() if last_message else None,
            'updatedAt': self.updated_at.isoformat() + 'Z' if self.updated_at else None,
        }


class ConversationParticipant(db.Model):
    """Association table for users and conversations"""
    __tablename__ = 'conversation_participants'

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversations.id'), primary_key=True)


class Message(db.Model):
    """Message model"""
    __tablename__ = 'messages'

    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversations.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    sender = db.relationship('User', backref='sent_messages')

    def to_dict(self):
        return {
            'id': self.id,
            'conversationId': self.conversation_id,
            'senderId': self.sender_id,
            'content': self.content,
            'isRead': self.is_read,
            'sender': self.sender.to_dict() if self.sender else None,
            'timestamp': self.created_at.isoformat() + 'Z' if self.created_at else None,
        }


class RoadmapTemplate(db.Model):
    """Predefined career roadmap templates"""
    __tablename__ = 'roadmap_templates'

    id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.String(100), nullable=False)  # e.g., "Frontend Developer"
    level = db.Column(db.String(50))  # e.g., "Junior", "Senior"
    description = db.Column(db.Text)
    cover_image = db.Column(db.String(500))
    estimated_duration = db.Column(db.String(50))  # e.g., "6-12 months"
    steps = db.Column(db.JSON)  # List of milestone objects
    skills_covered = db.Column(db.JSON)  # List of skill names
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'role': self.role,
            'level': self.level,
            'description': self.description,
            'coverImage': self.cover_image,
            'estimatedDuration': self.estimated_duration,
            'steps': self.steps or [],
            'skillsCovered': self.skills_covered or [],
            'isActive': self.is_active,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class UserRoadmap(db.Model):
    """User's saved/generated roadmaps"""
    __tablename__ = 'user_roadmaps'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    template_id = db.Column(db.Integer, db.ForeignKey('roadmap_templates.id'), nullable=True)
    title = db.Column(db.String(200), nullable=False)
    target_role = db.Column(db.String(100))
    target_level = db.Column(db.String(50))
    steps = db.Column(db.JSON)  # Personalized steps with progress
    progress = db.Column(db.Integer, default=0)  # Percentage 0-100
    is_ai_generated = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref=db.backref('roadmaps', lazy='dynamic'))
    template = db.relationship('RoadmapTemplate', backref='user_instances')

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'templateId': self.template_id,
            'title': self.title,
            'targetRole': self.target_role,
            'targetLevel': self.target_level,
            'steps': self.steps or [],
            'progress': self.progress,
            'isAiGenerated': self.is_ai_generated,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
        }