// import React from "react";
// import { Routes, Route, Link, Outlet } from "react-router-dom";
// import BookListPage from "./components/BookListPage";
// import BookDetailPage from "./components/BookDetailPage";
// import "./App.css";
// import LogoutButton from "./components/LogoutButton";
// import DashboardSwitcher from "./components/DashboardSwitcher";


// export default function MainAppLayout() {
//   const styles = {
//     navbar: {
//       display: "flex",
//       justifyContent: "center",
//       alignItems: "center",
//       padding: "15px 30px",
//       backgroundColor: "#66b2a0",
//       boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
//     },
//     navLinks: {
//       display: "flex",
//       gap: "30px",
//     },
//     navLink: {
//       color: "white",
//       textDecoration: "none",
//       fontSize: "1.1rem",
//       fontWeight: "bold",
//       borderBottom: "2px solid transparent",
//       paddingBottom: "2px",
//       transition: "border-bottom 0.2s",
//     },
//   };

//   return (
//     <div className="App">
//       <nav
//         style={{
//           ...styles.navbar,
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//         }}
//       >
//         <div style={{ width: "120px" }} />{" "}
//         {/* Optional left-side placeholder */}
//         <div style={styles.navLinks}>
//           <Link to="/app" style={styles.navLink}>
//             Home
//           </Link>
//           <Link to="/app/books" style={styles.navLink}>
//             All Books
//           </Link>
//         </div>
//         <div style={{ width: "120px", textAlign: "right" }}>
//           <LogoutButton />
//         </div>
//       </nav>

//       <Routes>
//         <Route index element={<DashboardSwitcher />} />
//         <Route path="books" element={<BookListPage />} />
//         <Route path="books/:bookId" element={<BookDetailPage />} />
//       </Routes>

//       <Outlet />
//     </div>
//   );
// }
