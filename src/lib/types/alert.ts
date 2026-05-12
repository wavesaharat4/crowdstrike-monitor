export interface CrowdStrikeAlert {
    id: string;
    detection_id: string;
    severity: 'Low' | 'Medium' | 'High';
    description: string;
    hostname: string;
    timestamp: string;
    ip_address?: string;
    username?: string;
    filename?: string;
    
    customer_message?: string

}