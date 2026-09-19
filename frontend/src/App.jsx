import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { SiteProvider } from './SiteContext'
import Layout from './components/Layout'
import Blog from './pages/Blog'
import Contact from './pages/Contact'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import Portfolio from './pages/Portfolio'
import ProjectDetail from './pages/ProjectDetail'
import Review from './pages/Review'
import Services from './pages/Services'
import Skills from './pages/Skills'

// The admin dashboard and the Markdown renderer are only downloaded when needed.
const AdminApp = lazy(() => import('./admin/AdminApp'))
const BlogPost = lazy(() => import('./pages/BlogPost'))

export default function App() {
  return (
    <BrowserRouter>
      <SiteProvider>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={<div className="preloader" />}>
                <AdminApp />
              </Suspense>
            }
          />
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="skills" element={<Skills />} />
            <Route path="services" element={<Services />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="portfolio/:id" element={<ProjectDetail />} />
            <Route path="blog" element={<Blog />} />
            <Route
              path="blog/:slug"
              element={
                <Suspense fallback={<section className="page-banner" />}>
                  <BlogPost />
                </Suspense>
              }
            />
            <Route path="contact" element={<Contact />} />
            <Route path="review/:token" element={<Review />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </SiteProvider>
    </BrowserRouter>
  )
}
