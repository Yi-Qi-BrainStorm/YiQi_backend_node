import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { readUsers, writeUsers } from '../utils/fileUtils';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 注册新用户
export const registerUser = async (username: string, password: string): Promise<User | null> => {
  const users = readUsers();
  
  // 检查用户名是否已存在
  const existingUser = users.find((user: User) => user.username === username);
  if (existingUser) {
    return null;
  }
  
  // 加密密码
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
  // 创建新用户
  const newUser: User = {
    id: Math.random().toString(36).substr(2, 9),
    username,
    password: hashedPassword,
    createdAt: new Date()
  };
  
  // 保存用户
  users.push(newUser);
  writeUsers(users);
  
  return newUser;
};

// 用户登录
export const loginUser = async (username: string, password: string): Promise<{token: string, user: User} | null> => {
  const users = readUsers();
  
  // 查找用户
  const user = users.find((u: User) => u.username === username);
  if (!user) {
    return null;
  }
  
  // 验证密码
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return null;
  }
  
  // 生成JWT令牌
  const token = jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  // 返回令牌和用户信息
  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      password: '', // 不返回密码
      createdAt: user.createdAt
    }
  };
};

// 验证JWT令牌
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};