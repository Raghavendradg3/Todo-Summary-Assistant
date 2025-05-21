-- Insert sample users (password is 'password123' hashed with bcrypt)
INSERT INTO users (username, email, password) VALUES
('user1', 'user1@example.com', '$2b$10$6KhZKNbFzDvmXoRRKxZZNeh2E4SwB5WOK.9YwWW5.93/UVFq5jJSa'),
('user2', 'user2@example.com', '$2b$10$6KhZKNbFzDvmXoRRKxZZNeh2E4SwB5WOK.9YwWW5.93/UVFq5jJSa');

-- Insert sample todos
INSERT INTO todos (title, completed, user_id) VALUES
('Complete project documentation', false, 1),
('Prepare presentation slides', false, 1),
('Review code changes', true, 1),
('Schedule team meeting', false, 1),
('Update website content', true, 1),
('Research new technologies', false, 2),
('Fix reported bugs', true, 2),
('Implement new feature', false, 2),
('Write unit tests', false, 2),
('Deploy to production', false, 2);
