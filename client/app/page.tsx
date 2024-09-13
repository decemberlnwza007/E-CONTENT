"use client";

import { Button } from "@nextui-org/button";
import { Card, Input } from "@nextui-org/react";
import './index.css';
import React, { useState } from "react";
import Swal from "sweetalert2";

export default function Home() {
  const BASE_URL = 'http://localhost:8000';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError("ชื่อผู้ใช้และรหัสผ่านจำเป็นต้องกรอก");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        Swal.fire({
          icon: "success",
          titleText: "เข้าสู่ระบบสำเร็จ",
          confirmButtonColor: "#006FEE",
          showConfirmButton: true,
          confirmButtonText: "ตกลง"
        }).then(() => {
          window.location.replace('/home');
        });
      } else {
        Swal.fire({
          icon: "error",
          titleText: "เข้าสู่ระบบไม่สำเร็จ",
          text: "กรุณาตรวจสอบชื่อผู้ใช้และรหัสผ่าน",
          confirmButtonColor: "#006FEE",
          showConfirmButton: true,
          confirmButtonText: "ตกลง"
        });
      }
    } catch (error) {
      console.error(error);
      setError("เกิดข้อผิดพลาด กรุณาลองอีกครั้งภายหลัง");
    }
  };

  return (
    <center>
      <form onSubmit={handleLogin}>
        <Card style={{ width: '500px', padding: '50px', borderRadius: '25px', marginBlock: '100px' }}>
          <h1 className="text-4xl">เข้าสู่ระบบ</h1>
          <br />
          <Input
            placeholder="ชื่อผู้ใช้"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <br />
          <Input
            placeholder="รหัสผ่าน"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <br />
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <Button type="submit" color="primary">เข้าสู่ระบบ</Button>
        </Card>
      </form>
    </center>
  );
}
