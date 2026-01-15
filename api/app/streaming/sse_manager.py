import asyncio
from typing import Dict, Set
import json
from datetime import datetime
from app.models.report import SSEEvent, ProcessingStatus
import logging

logger = logging.getLogger(__name__)

class SSEManager:
    def __init__(self):
        self.connections: Dict[str, Set[asyncio.Queue]] = {}
    
    async def subscribe(self, document_id: str) -> asyncio.Queue:
        """Subscribe to SSE events for a document"""
        if document_id not in self.connections:
            self.connections[document_id] = set()
        
        queue = asyncio.Queue()
        self.connections[document_id].add(queue)
        logger.info(f"Client subscribed to document {document_id}")
        return queue
    
    async def unsubscribe(self, document_id: str, queue: asyncio.Queue):
        """Unsubscribe from SSE events"""
        if document_id in self.connections:
            self.connections[document_id].discard(queue)
            if not self.connections[document_id]:
                del self.connections[document_id]
        logger.info(f"Client unsubscribed from document {document_id}")
    
    async def send_event(self, document_id: str, event_type: str, data: Dict):
        """Send SSE event to all subscribers"""
        if document_id not in self.connections:
            return
        
        event = SSEEvent(
            event_type=event_type,
            data=data,
            document_id=document_id,
            timestamp=datetime.utcnow().isoformat()
        )
        
        event_json = f"event: {event_type}\ndata: {event.model_dump_json()}\n\n"
        
        dead_queues = []
        for queue in list(self.connections[document_id]):
            try:
                await queue.put(event_json)
            except Exception as e:
                logger.error(f"Error sending event to queue: {e}")
                dead_queues.append(queue)
        
        # Clean up dead connections
        for queue in dead_queues:
            self.connections[document_id].discard(queue)
    
    async def event_generator(self, document_id: str):
        """Generate SSE events for a specific document"""
        queue = await self.subscribe(document_id)
        try:
            while True:
                # Wait for event with timeout to allow for cleanup
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=60.0)
                    yield event
                    queue.task_done()
                except asyncio.TimeoutError:
                    # Send keepalive comment
                    yield ": keepalive\n\n"
        except (asyncio.CancelledError, GeneratorExit) as e:
            logger.info(f"SSE connection closed for document {document_id}: {type(e).__name__}")
        except Exception as e:
            logger.error(f"Error in event generator for {document_id}: {e}", exc_info=True)
        finally:
            await self.unsubscribe(document_id, queue)
