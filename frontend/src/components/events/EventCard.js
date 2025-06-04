import React from 'react';
import { DateUtils } from '../../utils/dateUtils';

function EventCard({ event, onClick }) {
  const startDate = DateUtils.DateTime.fromISO(event.start_date);
  const isPast = DateUtils.isPast(startDate);
  
  const getRsvpBadgeClass = (rsvpStatus) => {
    switch(rsvpStatus) {
      case 'going': return 'bg-green-500 text-white';
      case 'interested': return 'bg-blue-500 text-white';
      case 'not_going': return 'bg-orange-500 text-white';
      default: return 'bg-gray-200 text-gray-800';
    }
  };
  
  const getRsvpText = (rsvpStatus) => {
    switch(rsvpStatus) {
      case 'going': return 'Going';
      case 'interested': return 'Interested';
      case 'not_going': return 'Not Going';
      default: return 'RSVP';
    }
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer" onClick={() => onClick(event.id)}>
      <div className="h-48 overflow-hidden">
        <img 
          src={event.cover_image || `https://source.unsplash.com/800x400?event&sig=${event.id}`} 
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>
      
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full uppercase tracking-wide">
            {event.format || 'in-person'}
          </span>
          {isPast && (
            <span className="inline-block px-3 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded-full uppercase tracking-wide">
              Past
            </span>
          )}
        </div>
        
        <h3 className="text-xl font-medium text-gray-800 mb-3 line-clamp-2">{event.title}</h3>
        
        <div className="flex items-center text-gray-600 mb-2">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm">{DateUtils.formatDateRange(event.start_date, event.end_date)}</span>
        </div>
        
        <div className="flex items-center text-gray-600 mb-4">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm">{event.location}</span>
        </div>
        
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {event.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs">
                #{tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <button className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
            Details
          </button>
          <button className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${getRsvpBadgeClass(event.rsvp_status)}`}>
            {getRsvpText(event.rsvp_status)}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventCard;