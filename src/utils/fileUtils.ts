import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(__dirname, '../data/users.json');

// 确保数据文件存在
export const ensureDataFileExists = (): void => {
  if (!fs.existsSync(path.dirname(dataFilePath))) {
    fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
  }
  
  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify([]));
  }
};

// 读取所有用户
export const readUsers = (): any[] => {
  ensureDataFileExists();
  const data = fs.readFileSync(dataFilePath, 'utf8');
  return JSON.parse(data);
};

// 写入所有用户
export const writeUsers = (users: any[]): void => {
  ensureDataFileExists();
  fs.writeFileSync(dataFilePath, JSON.stringify(users, null, 2));
};