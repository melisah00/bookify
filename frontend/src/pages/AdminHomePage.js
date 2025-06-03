import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, Stack } from '@mui/material';
import { Group, CreditCard, ShoppingCart } from '@mui/icons-material';
import { Line } from "react-chartjs-2";
import axios from 'axios';

import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend
} from 'chart.js';
import CreditCardIcon from '@mui/icons-material/CreditCard';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);


// Fejk podaci
const data = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [{
        label: "Income",
        data: [120, 150, 90, 170, 110, 200, 140],
        borderColor: "#1976d2",
        backgroundColor: "rgba(25, 118, 210, 0.2)",
        tension: 0.3,
        fill: true,
    }],
};

const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true } },
};

const cardStyle = {
    p: 3,
    borderRadius: 3,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: 'white',
    transition: 'transform 0.3s, box-shadow 0.3s',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 6px 16px rgba(0,0,0,0.15)'
    }
};

const iconStyle = {
    fontSize: 40,
    color: '#1976d2',
    p: 1,
    bgcolor: 'rgba(25, 118, 210, 0.1)',
    borderRadius: '50%',
    mr: 2
};

export default function AdminHomePage() {
    const [bookCount, setBookCount] = useState(null);
    const [readerCount, setReaderCount] = useState(null);
    const [authorCount, setAuthorCount] = useState(null);
    const [forumModeratorCount, setForumModeratorCount] = useState(null);
    const [forumAdminCount, setForumAdminCount] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [booksRes, readersRes, authorRes, forumModeratorRes, forumAdminRes] = await Promise.all([
                    axios.get('http://localhost:8000/books/count'),
                    axios.get('http://localhost:8000/users/count_readers'),
                    axios.get('http://localhost:8000/users/count_authors'),
                    axios.get('http://localhost:8000/users/count_forum_moderators'),
                    axios.get('http://localhost:8000/users/count_forum_admins'),
                ]);
                setBookCount(booksRes.data.total_books);
                setReaderCount(readersRes.data.total_readers);
                setAuthorCount(authorRes.data.total_authors);
                setForumModeratorCount(forumModeratorRes.data.total_forum_moderators);
                setForumAdminCount(forumAdminRes.data.total_forum_admins);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, []);

    return (
        <Box sx={{ p: 3, height: '100vh', width: '100%', bgcolor: '#f8f9fa' }}>
            <Grid container spacing={3} sx={{ height: '100%' }}>
                <Grid size={8} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ mb: 2 }}>
                        <Stack spacing={2} direction="row" sx={{ height: '120px' }}>
                            <Card sx={{
                                flex: 1,
                                p: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                bgcolor: 'white',
                                boxShadow: 3,
                                borderRadius: 2,
                                height: '100%'
                            }}>
                                <CreditCardIcon sx={{
                                    fontSize: 40,
                                    color: '#1976d2',
                                    p: 1,
                                    bgcolor: 'rgba(25, 118, 210, 0.1)',
                                    borderRadius: '50%'
                                }} />
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                        {bookCount !== null ? bookCount : '...'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Total Books
                                    </Typography>
                                </Box>
                            </Card>


                            <Card sx={{
                                flex: 1,
                                p: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                bgcolor: 'white',
                                boxShadow: 3,
                                borderRadius: 2,
                                height: '100%'
                            }}>
                                <ShoppingCart sx={{
                                    fontSize: 40,
                                    color: '#1976d2',
                                    p: 1,
                                    bgcolor: 'rgba(25, 118, 210, 0.1)',
                                    borderRadius: '50%'
                                }} />
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                        $12,345
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Total Profit
                                    </Typography>
                                </Box>
                            </Card>
                        </Stack>
                    </Box>


                    <Box sx={{ flexGrow: 1 }}>
                        <Card sx={{ ...cardStyle, p: 2, height: '100%' }}>
                            <Box sx={{ height: '100%' }}>
                                <Line data={data} options={options} />
                            </Box>
                        </Card>
                    </Box>
                </Grid>


                <Grid size={4}>
                    <Stack spacing={3} sx={{ height: '100%' }}>
                        <Card sx={cardStyle}>
                            <Stack direction="row" alignItems="center">
                                <Group sx={iconStyle} />
                                <Box>
                                    <Typography variant="h5" fontWeight="bold">
                                        {readerCount ?? '...'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Total Readers
                                    </Typography>
                                </Box>
                            </Stack>
                        </Card>

                        <Card sx={cardStyle}>
                            <Stack direction="row" alignItems="center">
                                <Group sx={iconStyle} />
                                <Box>
                                    <Typography variant="h5" fontWeight="bold">
                                        {authorCount ?? '...'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Total Authors
                                    </Typography>
                                </Box>
                            </Stack>
                        </Card>

                        <Card sx={cardStyle}>
                            <Stack direction="row" alignItems="center">
                                <Group sx={iconStyle} />
                                <Box>
                                    <Typography variant="h5" fontWeight="bold">
                                        {forumModeratorCount ?? '...'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Forum Moderators
                                    </Typography>
                                </Box>
                            </Stack>
                        </Card>

                        <Card sx={cardStyle}>
                            <Stack direction="row" alignItems="center">
                                <Group sx={iconStyle} />
                                <Box>
                                    <Typography variant="h5" fontWeight="bold">
                                        {forumAdminCount ?? '...'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Forum Admins
                                    </Typography>
                                </Box>
                            </Stack>
                        </Card>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
}