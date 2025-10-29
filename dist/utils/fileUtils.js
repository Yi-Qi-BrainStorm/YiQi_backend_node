"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeUsers = exports.readUsers = exports.ensureDataFileExists = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dataFilePath = path_1.default.join(__dirname, '../data/users.json');
// 确保数据文件存在
const ensureDataFileExists = () => {
    if (!fs_1.default.existsSync(path_1.default.dirname(dataFilePath))) {
        fs_1.default.mkdirSync(path_1.default.dirname(dataFilePath), { recursive: true });
    }
    if (!fs_1.default.existsSync(dataFilePath)) {
        fs_1.default.writeFileSync(dataFilePath, JSON.stringify([]));
    }
};
exports.ensureDataFileExists = ensureDataFileExists;
// 读取所有用户
const readUsers = () => {
    (0, exports.ensureDataFileExists)();
    const data = fs_1.default.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
};
exports.readUsers = readUsers;
// 写入所有用户
const writeUsers = (users) => {
    (0, exports.ensureDataFileExists)();
    fs_1.default.writeFileSync(dataFilePath, JSON.stringify(users, null, 2));
};
exports.writeUsers = writeUsers;
