import { Bell } from "lucide-react";
import ChartCard from "./ChartCard.jsx";
import { formatLastActive } from "../../../common/formatters.js";
import { initialNotifications } from "../../Notifications/notificationData.js";

function RecentActivity() {
  return (
    <ChartCard icon={Bell} title="Recent activity" description="Uploads, failures and configuration changes you can access" className="dash-span-2">
      <ul className="dash-activity">
        {initialNotifications.slice(0, 5).map((item) => (
          <li key={item.id} className="dash-activity-item">
            <span className={`dash-activity-icon tone-${item.tone}`}>
              <item.icon size={16} aria-hidden="true" />
            </span>
            <span className="dash-activity-text">
              <strong>{item.title}</strong>
              <span>{item.text}</span>
              <small>{formatLastActive(item.at)}</small>
            </span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}

export default RecentActivity;
