from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from sqlalchemy.orm import selectinload
from models.event import Event, EventParticipant, EventParticipantStatusEnum
from models.user import User
from repositories import event_repository
import csv
import io

class EventAnalyticsService:
    
    async def get_organizer_analytics(self, organizer_id: int, db: AsyncSession) -> Dict[str, Any]:
        """Get comprehensive analytics for an organizer"""
        
        # Get all events by organizer
        events = await event_repository.get_events_by_organizer(organizer_id, db)
        
        if not events:
            return self._empty_analytics()
        
        # Calculate various metrics
        total_events = len(events)
        total_participants = sum(len(event.participants) for event in events)
        
        # Events by status
        now = datetime.now()
        upcoming_events = len([e for e in events if e.start_date > now])
        past_events = len([e for e in events if e.start_date <= now])
        
        # Participation metrics
        participation_stats = self._calculate_participation_stats(events)
        
        # Monthly trends
        monthly_trends = self._calculate_monthly_trends(events)
        
        # Popular tags
        popular_tags = self._calculate_popular_tags(events)
        
        # Event performance
        event_performance = self._calculate_event_performance(events)
        
        # Recent activity
        recent_activity = self._get_recent_activity(events)
        
        return {
            "summary": {
                "total_events": total_events,
                "total_participants": total_participants,
                "upcoming_events": upcoming_events,
                "past_events": past_events,
                "average_participants_per_event": round(total_participants / total_events, 1) if total_events > 0 else 0
            },
            "participation_stats": participation_stats,
            "monthly_trends": monthly_trends,
            "popular_tags": popular_tags,
            "event_performance": event_performance,
            "recent_activity": recent_activity
        }
    
    async def get_event_detailed_analytics(self, event_id: int, organizer_id: int, db: AsyncSession) -> Dict[str, Any]:
        """Get detailed analytics for a specific event"""
        
        event = await event_repository.get_event_by_id(event_id, db)
        if not event or event.organizer_id != organizer_id:
            return {}
        
        participants = event.participants
        
        # Registration timeline
        registration_timeline = self._calculate_registration_timeline(participants)
        
        # Status breakdown
        status_breakdown = self._calculate_status_breakdown(participants)
        
        # Demographics (if we have user data)
        demographics = await self._calculate_demographics(participants, db)
        
        return {
            "event_info": {
                "id": event.id,
                "title": event.title,
                "start_date": event.start_date,
                "total_participants": len(participants),
                "guest_limit": event.guest_limit,
                "capacity_percentage": (len(participants) / event.guest_limit * 100) if event.guest_limit else None
            },
            "registration_timeline": registration_timeline,
            "status_breakdown": status_breakdown,
            "demographics": demographics
        }
    
    async def export_event_data(self, event_id: int, organizer_id: int, format: str, db: AsyncSession) -> bytes:
        """Export event data in various formats"""
        
        event = await event_repository.get_event_by_id(event_id, db)
        if not event or event.organizer_id != organizer_id:
            raise ValueError("Event not found or not authorized")
        
        if format.lower() == 'csv':
            return self._export_to_csv(event)
        elif format.lower() == 'json':
            return self._export_to_json(event)
        else:
            raise ValueError("Unsupported format")
    
    def _empty_analytics(self) -> Dict[str, Any]:
        return {
            "summary": {
                "total_events": 0,
                "total_participants": 0,
                "upcoming_events": 0,
                "past_events": 0,
                "average_participants_per_event": 0
            },
            "participation_stats": [],
            "monthly_trends": [],
            "popular_tags": [],
            "event_performance": [],
            "recent_activity": []
        }
    
    def _calculate_participation_stats(self, events: List[Event]) -> List[Dict]:
        stats = {}
        for event in events:
            for participant in event.participants:
                status = participant.status.value
                if status not in stats:
                    stats[status] = 0
                stats[status] += 1
        
        return [{"status": k, "count": v} for k, v in stats.items()]
    
    def _calculate_monthly_trends(self, events: List[Event]) -> List[Dict]:
        monthly_data = {}
        
        for event in events:
            month_key = event.start_date.strftime('%Y-%m')
            if month_key not in monthly_data:
                monthly_data[month_key] = {
                    "month": event.start_date.strftime('%B %Y'),
                    "events": 0,
                    "participants": 0
                }
            monthly_data[month_key]["events"] += 1
            monthly_data[month_key]["participants"] += len(event.participants)
        
        return sorted(monthly_data.values(), key=lambda x: x["month"])
    
    def _calculate_popular_tags(self, events: List[Event]) -> List[Dict]:
        tag_counts = {}
        
        for event in events:
            for tag in event.tags:
                if tag.name not in tag_counts:
                    tag_counts[tag.name] = 0
                tag_counts[tag.name] += 1
        
        sorted_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)
        return [{"tag": tag, "count": count} for tag, count in sorted_tags[:10]]
    
    def _calculate_event_performance(self, events: List[Event]) -> List[Dict]:
        performance = []
        
        for event in events:
            participant_count = len(event.participants)
            capacity_percentage = (participant_count / event.guest_limit * 100) if event.guest_limit else None
            
            performance.append({
                "id": event.id,
                "title": event.title,
                "start_date": event.start_date,
                "participants": participant_count,
                "capacity_percentage": capacity_percentage,
                "status": "past" if event.start_date < datetime.now() else "upcoming"
            })
        
        return sorted(performance, key=lambda x: x["participants"], reverse=True)
    
    def _get_recent_activity(self, events: List[Event]) -> List[Dict]:
        activity = []
        
        # Recent registrations
        for event in events:
            for participant in event.participants:
                activity.append({
                    "type": "registration",
                    "event_title": event.title,
                    "event_id": event.id,
                    "timestamp": participant.registered_at,
                    "status": participant.status.value
                })
        
        # Sort by timestamp and return recent 20
        activity.sort(key=lambda x: x["timestamp"], reverse=True)
        return activity[:20]
    
    def _calculate_registration_timeline(self, participants: List[EventParticipant]) -> List[Dict]:
        timeline = {}
        
        for participant in participants:
            date_key = participant.registered_at.date().isoformat()
            if date_key not in timeline:
                timeline[date_key] = 0
            timeline[date_key] += 1
        
        return [{"date": date, "registrations": count} for date, count in sorted(timeline.items())]
    
    def _calculate_status_breakdown(self, participants: List[EventParticipant]) -> List[Dict]:
        breakdown = {}
        
        for participant in participants:
            status = participant.status.value
            if status not in breakdown:
                breakdown[status] = 0
            breakdown[status] += 1
        
        return [{"status": status, "count": count} for status, count in breakdown.items()]
    
    async def _calculate_demographics(self, participants: List[EventParticipant], db: AsyncSession) -> Dict[str, Any]:
        # This is a placeholder - you can expand based on user data you want to analyze
        return {
            "total_participants": len(participants),
            "registration_sources": "Not implemented",
            "user_types": "Not implemented"
        }
    
    def _export_to_csv(self, event: Event) -> bytes:
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write headers
        writer.writerow(['Name', 'Email', 'Registration Date', 'Status', 'First Name', 'Last Name'])
        
        # Write participant data
        for participant in event.participants:
            writer.writerow([
                participant.user.username if participant.user else 'N/A',
                participant.user.email if participant.user else 'N/A',
                participant.registered_at.strftime('%Y-%m-%d %H:%M:%S'),
                participant.status.value,
                participant.user.first_name if participant.user else 'N/A',
                participant.user.last_name if participant.user else 'N/A'
            ])
        
        output.seek(0)
        return output.getvalue().encode('utf-8')
    
    def _export_to_json(self, event: Event) -> bytes:
        import json
        
        data = {
            "event": {
                "id": event.id,
                "title": event.title,
                "description": event.description,
                "start_date": event.start_date.isoformat(),
                "end_date": event.end_date.isoformat(),
                "location": event.location,
                "format": event.format.value if event.format else None
            },
            "participants": [
                {
                    "username": p.user.username if p.user else None,
                    "email": p.user.email if p.user else None,
                    "first_name": p.user.first_name if p.user else None,
                    "last_name": p.user.last_name if p.user else None,
                    "registration_date": p.registered_at.isoformat(),
                    "status": p.status.value
                }
                for p in event.participants
            ]
        }
        
        return json.dumps(data, indent=2).encode('utf-8')

# Global analytics service instance
analytics_service = EventAnalyticsService()