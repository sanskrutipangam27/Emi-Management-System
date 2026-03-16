// Authentication Functions

// Check if user is logged in
function checkAuth() {
    const userId = localStorage.getItem('user_id');
    const username = localStorage.getItem('username');
    
    if (!userId || !username) {
        if (window.location.pathname !== '/login.html' && 
            window.location.pathname !== '/register.html' && 
            !window.location.pathname.endsWith('login.html') && 
            !window.location.pathname.endsWith('register.html')) {
            window.location.href = 'login.html';
        }
        return false;
    }
    return true;
}

// Register new user
async function register(username, email, password) {
    try {
        // Check if username exists
        const { data: existingUsers } = await supabase
            .from('users')
            .select('*')
            .eq('username', username);
        
        if (existingUsers && existingUsers.length > 0) {
            return { success: false, error: 'Username already exists' };
        }
        
        // Check if email exists
        const { data: existingEmails } = await supabase
            .from('users')
            .select('*')
            .eq('email', email);
        
        if (existingEmails && existingEmails.length > 0) {
            return { success: false, error: 'Email already exists' };
        }
        
        // Hash password (simple hash for demo - in production use proper hashing)
        const hashedPassword = await hashPassword(password);
        
        // Insert new user
        const { data, error } = await supabase
            .from('users')
            .insert([{ username, email, password: hashedPassword }])
            .select();
        
        if (error) throw error;
        
        return { success: true };
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: error.message };
    }
}

// Login user
async function login(username, password) {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username);
        
        if (error) throw error;
        
        if (!users || users.length === 0) {
            return { success: false, error: 'Invalid username or password' };
        }
        
        const user = users[0];
        
        // Verify password
        const isValid = await verifyPassword(password, user.password);
        
        if (!isValid) {
            return { success: false, error: 'Invalid username or password' };
        }
        
        // Save to localStorage
        localStorage.setItem('user_id', user.id);
        localStorage.setItem('username', user.username);
        
        return { success: true };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

// Logout user
function logout() {
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}

// Simple password hashing (for demo - use proper bcrypt in production)
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'salt_key_12345');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify password
async function verifyPassword(password, hashedPassword) {
    const hash = await hashPassword(password);
    return hash === hashedPassword;
}

// Get current user info
function getCurrentUser() {
    return {
        id: parseInt(localStorage.getItem('user_id')),
        username: localStorage.getItem('username')
    };
}