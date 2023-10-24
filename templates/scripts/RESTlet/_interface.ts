interface Response {
    success: boolean;
    message?: string;
    data?: any;
}

interface Request {
    recordType?: string;
    recordId?: number;
    [key: string]: any;
}

