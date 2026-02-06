import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import HotelDetail from './pages/HotelDetail';
import GuestDetails from './pages/GuestDetails';
import BookingPreview from './pages/BookingPreview';
import Bookings from './pages/Bookings';
import BookingConfirmation from './pages/BookingConfirmation';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/hotel/:hotelId" element={<HotelDetail />} />
        <Route path="/hotel/:hotelId/guest-details" element={<GuestDetails />} />
        <Route path="/hotel/:hotelId/preview" element={<BookingPreview />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/booking/confirmation" element={<BookingConfirmation />} />
      </Routes>
    </Layout>
  );
}
