from datetime import datetime
from typing import List, Optional
from models.event import Event
import uuid

class ICalService:
    
    def generate_event_ical(self, event: Event) -> str:
        """Generate iCal content for a single event"""
        
        ical_content = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Bookify//Event Management//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            "BEGIN:VEVENT"
        ]
        
        # Event details
        ical_content.extend([
            f"UID:{event.id}@bookify.com",
            f"DTSTART:{self._format_datetime(event.start_date)}",
            f"DTEND:{self._format_datetime(event.end_date)}",
            f"SUMMARY:{self._escape_text(event.title)}",
            f"DESCRIPTION:{self._escape_text(event.description or '')}",
            f"LOCATION:{self._escape_text(event.location or '')}",
            f"ORGANIZER:CN={self._escape_text(event.organizer.username if event.organizer else 'Unknown')}",
            f"CREATED:{self._format_datetime(event.created_at)}",
            f"LAST-MODIFIED:{self._format_datetime(event.updated_at)}",
            "STATUS:CONFIRMED"
        ])
        
        # Add meeting link as URL if it's a virtual event
        if event.meeting_link:
            ical_content.append(f"URL:{event.meeting_link}")
        
        # Add tags as categories
        if event.tags:
            categories = ",".join([tag.name for tag in event.tags])
            ical_content.append(f"CATEGORIES:{categories}")
        
        # Add alarm (reminder 1 hour before)
        ical_content.extend([
            "BEGIN:VALARM",
            "TRIGGER:-PT1H",
            "ACTION:DISPLAY",
            f"DESCRIPTION:Reminder: {self._escape_text(event.title)} starts in 1 hour",
            "END:VALARM"
        ])
        
        ical_content.extend([
            "END:VEVENT",
            "END:VCALENDAR"
        ])
        
        return "\r\n".join(ical_content)
    
    def generate_calendar_feed(self, events: List[Event], calendar_name: str = "Bookify Events") -> str:
        """Generate iCal content for multiple events"""
        
        ical_content = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Bookify//Event Management//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            f"X-WR-CALNAME:{calendar_name}",
            "X-WR-TIMEZONE:UTC",
            "X-WR-CALDESC:Events from Bookify Platform"
        ]
        
        for event in events:
            ical_content.extend([
                "BEGIN:VEVENT",
                f"UID:{event.id}@bookify.com",
                f"DTSTART:{self._format_datetime(event.start_date)}",
                f"DTEND:{self._format_datetime(event.end_date)}",
                f"SUMMARY:{self._escape_text(event.title)}",
                f"DESCRIPTION:{self._escape_text(event.description or '')}",
                f"LOCATION:{self._escape_text(event.location or '')}",
                f"ORGANIZER:CN={self._escape_text(event.organizer.username if event.organizer else 'Unknown')}",
                f"CREATED:{self._format_datetime(event.created_at)}",
                f"LAST-MODIFIED:{self._format_datetime(event.updated_at)}",
                "STATUS:CONFIRMED"
            ])
            
            if event.meeting_link:
                ical_content.append(f"URL:{event.meeting_link}")
            
            if event.tags:
                categories = ",".join([tag.name for tag in event.tags])
                ical_content.append(f"CATEGORIES:{categories}")
            
            ical_content.append("END:VEVENT")
        
        ical_content.append("END:VCALENDAR")
        
        return "\r\n".join(ical_content)
    
    def _format_datetime(self, dt: datetime) -> str:
        """Format datetime for iCal"""
        if dt:
            return dt.strftime('%Y%m%dT%H%M%SZ')
        return ""
    
    def _escape_text(self, text: str) -> str:
        """Escape text for iCal format"""
        if not text:
            return ""
        
        # Replace special characters
        text = text.replace('\\', '\\\\')
        text = text.replace(';', '\\;')
        text = text.replace(',', '\\,')
        text = text.replace('\n', '\\n')
        text = text.replace('\r', '')
        
        return text

# Global iCal service instance
ical_service = ICalService()