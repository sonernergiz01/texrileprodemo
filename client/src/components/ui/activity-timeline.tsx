import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

interface ActivityTimelineItem {
  id: number;
  type: string;
  description: string;
  userId: number;
  userName: string;
  timestamp: string | Date;
  entityId?: number;
  entityType?: string;
  icon?: React.ReactNode;
}

interface ActivityTimelineProps {
  activities: ActivityTimelineItem[];
  className?: string;
  showViewAll?: boolean;
  limit?: number;
  onViewAllClick?: () => void;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'order_created':
      return (
        <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="text-white text-sm" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </span>
      );
    case 'order_status_updated':
      return (
        <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="text-white text-sm" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
      );
    case 'customer_created':
      return (
        <span className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center ring-8 ring-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="text-white text-sm" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </span>
      );
    case 'user_created':
      return (
        <span className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center ring-8 ring-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="text-white text-sm" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
        </span>
      );
    default:
      return (
        <span className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center ring-8 ring-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="text-white text-sm" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </span>
      );
  }
};

const getRelativeTime = (timestamp: string | Date) => {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diff = (now.getTime() - activityTime.getTime()) / 1000; // diff in seconds
  
  if (diff < 60) return 'az önce';
  if (diff < 3600) return `${Math.floor(diff / 60)} dakika önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} gün önce`;
  
  return formatDate(activityTime);
};

export const ActivityTimeline = ({ 
  activities, 
  className, 
  showViewAll = true,
  limit = 4,
  onViewAllClick 
}: ActivityTimelineProps) => {
  const displayActivities = limit ? activities.slice(0, limit) : activities;
  
  return (
    <div className={cn("flow-root", className)}>
      <ul role="list" className="-mb-8">
        {displayActivities.map((activity, activityIdx) => (
          <li key={activity.id} className="timeline-item">
            <div className="relative pb-8">
              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 timeline-line" aria-hidden="true"></span>
              <div className="relative flex space-x-3">
                <div>
                  {activity.icon || getActivityIcon(activity.type)}
                </div>
                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-sm text-gray-800">
                      {activity.type === 'user_created' && (
                        <>
                          <span className="font-medium">{activity.userName}</span> kullanıcısı oluşturuldu
                        </>
                      )}
                      {activity.type === 'order_created' && (
                        <>
                          <span className="font-medium">{activity.userName}</span> yeni sipariş oluşturdu:
                          <span className="font-medium ml-1">{activity.description.split('created')[0].trim()}</span>
                        </>
                      )}
                      {activity.type === 'order_status_updated' && (
                        <>
                          <span className="font-medium">{activity.description.split('status')[0].trim()}</span> siparişinin durumu güncellendi
                        </>
                      )}
                      {activity.type === 'customer_created' && (
                        <>
                          <span className="font-medium">{activity.userName}</span> yeni müşteri ekledi:
                          <span className="font-medium ml-1">{activity.description.split('added')[0].trim()}</span>
                        </>
                      )}
                      {!['user_created', 'order_created', 'order_status_updated', 'customer_created'].includes(activity.type) && (
                        <>{activity.description}</>
                      )}
                    </p>
                  </div>
                  <div className="text-right text-sm whitespace-nowrap text-gray-500">
                    <time dateTime={new Date(activity.timestamp).toISOString()}>
                      {getRelativeTime(activity.timestamp)}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      
      {showViewAll && activities.length > limit && (
        <div className="mt-4 text-center">
          <button 
            onClick={onViewAllClick}
            className="text-sm font-medium text-primary hover:text-primary-dark"
          >
            Tüm aktiviteleri görüntüle
          </button>
        </div>
      )}
      
      {activities.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          Henüz aktivite bulunmamaktadır.
        </div>
      )}
    </div>
  );
};
