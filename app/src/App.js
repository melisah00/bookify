
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom'; 
import './App.css'; 
import BookListPage from './components/BookListPage'; 
import BookDetailPage from './components/BookDetailPage';

const colors = {
    backgroundLight: 'rgb(248,246,241)',
    backgroundMedium: 'rgb(225,234,229)',
    accentLight: 'rgb(167,215,184)',
    accentMedium: 'rgb(102,178,160)',
    textDark: 'rgb(78,121,107)',
};

function App() {

    const styles = {
        nav: {
            backgroundColor: colors.accentMedium,
            padding: '10px 20px',
            marginBottom: '20px',
            borderRadius: '0 0 8px 8px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        },
        navList: {
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            gap: '20px',
        },
        navLink: {
            color: colors.backgroundLight,
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '1.1em',
            padding: '5px 0',
            transition: 'border-bottom 0.2s',
            borderBottom: '2px solid transparent', 
        },
        navLinkHover: { 
             borderBottom: `2px solid ${colors.backgroundLight}`
        }
    };

    const handleNavMouseEnter = (e) => e.target.style.borderBottom = styles.navLinkHover.borderBottom;
    const handleNavMouseLeave = (e) => e.target.style.borderBottom = '2px solid transparent';

    return (
        <div className="App" style={{ backgroundColor: colors.backgroundLight }}>
            <nav style={styles.nav}>
                <ul style={styles.navList}>
                    <li>
                       <Link to="/"
                             style={styles.navLink}
                             onMouseEnter={handleNavMouseEnter}
                             onMouseLeave={handleNavMouseLeave}
                       >Početna</Link> 
                    </li>
                    <li>
                       <Link to="/books"
                             style={styles.navLink}
                             onMouseEnter={handleNavMouseEnter}
                             onMouseLeave={handleNavMouseLeave}
                        >Sve Knjige</Link> 
                    </li>
                </ul>
            </nav>

            <main style={{ padding: '0 20px' }}> 
                <Routes>
                    <Route path="/" element={
                        <div>
                            <h1 style={{color: colors.textDark}}>Dobrodošli na Bookify</h1>
                            <p style={{color: colors.textDark}}>Pregledajte našu kolekciju knjiga i ostavite recenziju!</p>
                            <Link to="/books" style={{
                                display: 'inline-block',
                                padding: '10px 15px',
                                backgroundColor: colors.accentMedium,
                                color: colors.backgroundLight,
                                textDecoration: 'none',
                                borderRadius: '5px',
                                marginTop: '15px',
                                fontWeight: 'bold'
                            }}>
                                Pogledaj Knjige
                            </Link>
                        </div>
                    } />

                    <Route path="/books" element={<BookListPage />} />

                    <Route path="/books/:bookId" element={<BookDetailPage />} />

                </Routes>
            </main>
        </div>
    );
}

export default App;