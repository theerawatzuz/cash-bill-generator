# สร้าง Stage แรกสำหรับ Build Next.js
FROM node:20-alpine AS builder

WORKDIR /app

# คัดลอกไฟล์ package.json และ lockfile เพื่อให้ Docker Cache การติดตั้ง
COPY package.json package-lock.json ./

# ติดตั้ง Dependencies
RUN npm install --frozen-lockfile

# คัดลอกไฟล์ทั้งหมด
COPY . .

# สร้าง Production Build ของ Next.js
RUN npm run build

# สร้าง Stage สุดท้ายสำหรับรันแอป (ลดขนาด Image)
FROM node:20-alpine
WORKDIR /app

# คัดลอกโค้ดที่ Build เสร็จแล้วจาก Stage ก่อนหน้า
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public

# เปิดพอร์ต 3000
EXPOSE 3000

# คำสั่งเริ่มต้นสำหรับรันแอป
CMD ["npm", "run", "start"]