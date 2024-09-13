"use client";

import React, { useState, useEffect } from 'react';
import './Table.css';

import { Button } from '@nextui-org/button';
import { Input } from '@nextui-org/input';

import { Navbar } from '@/components/navbar';

interface DataRow {
    id: number;
    date: string;
    sender: string;
    subject: string;
    receiver: string;
    file: string;
    note: string;
}

const TableComponent: React.FC = () => {
    const [data, setData] = useState<DataRow[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [editingData, setEditingData] = useState<DataRow | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:8000/data/get');
                const result: DataRow[] = await response.json();
                if (Array.isArray(result)) {
                    setData(result);
                } else {
                    console.error('Unexpected data format:', result);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, []);

    const totalPages = Math.ceil(data.length / itemsPerPage);

    const filteredData = data.filter((row) => {
        return (
            row.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row.receiver.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row.file.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row.note.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await fetch(`http://localhost:8000/data/delete/${id}`, {
                method: 'DELETE',
            });
            setData(data.filter((row) => row.id !== id));
        } catch (error) {
            console.error('Error deleting data:', error);
        }
    };

    const handleUpdate = async () => {
        if (editingData) {
            try {
                await fetch(`http://localhost:8000/data/update/${editingData.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(editingData),
                });
                setData(data.map((row) => (row.id === editingData.id ? editingData : row)));
                setEditingData(null);
                setIsModalOpen(false);
            } catch (error) {
                console.error('Error updating data:', error);
            }
        }
    };

    return (
        <>
            <Navbar />
            <br />
            <div className="table-container">
                <h2>รายการเอกสาร</h2>

                <Input
                    type="text"
                    placeholder="ค้นหา..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <br />
                <br />
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>เลขที่</th>
                            <th>วันที่</th>
                            <th>ผู้ส่ง</th>
                            <th>ผู้รับ</th>
                            <th>เรื่อง</th>
                            <th>ไฟล์</th>
                            <th>โน้ต</th>
                            <th>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((row) => (
                            <tr key={row.id}>
                                <td>{row.id}</td>
                                <td>{new Date(row.date).toLocaleDateString()}</td>
                                <td>{row.sender}</td>
                                <td>{row.receiver}</td>
                                <td>{row.subject}</td>
                                <td>
                                    <a href={`/${row.file}`} download className="file-link">
                                        {row.file}
                                    </a>
                                </td>
                                <td>{row.note}</td>
                                <td>
                                    <Button color='primary' onClick={() => {
                                        setEditingData(row);
                                        setIsModalOpen(true);
                                    }}>แก้ไข</Button>
                                    &nbsp;
                                    <Button color='danger' onClick={() => handleDelete(row.id)}>ลบ</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <br />
                <div className="pagination-controls">
                    <Button
                        color='warning'
                        disabled={currentPage === 1}
                        onClick={handlePreviousPage}
                    >
                        หน้าก่อนหน้า
                    </Button>
                    &nbsp;
                    &nbsp;
                    <span>หน้า {currentPage} จาก {totalPages}</span>
                    &nbsp;
                    &nbsp;
                    <Button
                        color='primary'
                        disabled={currentPage === totalPages}
                        onClick={handleNextPage}
                    >
                        หน้าต่อไป
                    </Button>
                </div>

                {isModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg w-1/2">
                            <h3 className="text-lg font-semibold">แก้ไขข้อมูล</h3>
                            <div className="mt-4">
                                {editingData && (
                                    <>
                                        <Input
                                            type="text"
                                            placeholder="วันที่"
                                            value={editingData.date}
                                            onChange={(e) => setEditingData({ ...editingData, date: e.target.value })}
                                            className="mb-4"
                                        />
                                        <Input
                                            type="text"
                                            placeholder="ผู้ส่ง"
                                            value={editingData.sender}
                                            onChange={(e) => setEditingData({ ...editingData, sender: e.target.value })}
                                            className="mb-4"
                                        />
                                        <Input
                                            type="text"
                                            placeholder="ผู้รับ"
                                            value={editingData.receiver}
                                            onChange={(e) => setEditingData({ ...editingData, receiver: e.target.value })}
                                            className="mb-4"
                                        />
                                        <Input
                                            type="text"
                                            placeholder="เรื่อง"
                                            value={editingData.subject}
                                            onChange={(e) => setEditingData({ ...editingData, subject: e.target.value })}
                                            className="mb-4"
                                        />
                                        <Input
                                            type="text"
                                            placeholder="ไฟล์"
                                            value={editingData.file}
                                            onChange={(e) => setEditingData({ ...editingData, file: e.target.value })}
                                            className="mb-4"
                                        />
                                        <Input
                                            type="text"
                                            placeholder="โน้ต"
                                            value={editingData.note}
                                            onChange={(e) => setEditingData({ ...editingData, note: e.target.value })}
                                            className="mb-4"
                                        />
                                        <Button color='success' onClick={handleUpdate}>บันทึก</Button>
                                        <Button color='danger' onClick={() => setIsModalOpen(false)} className="ml-2">ยกเลิก</Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default TableComponent;
