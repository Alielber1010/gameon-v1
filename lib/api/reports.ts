/**
 * API client for reports endpoints
 */

export interface ReportResponse {
  success: boolean;
  data?: any;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateReportData {
  gameId: string;
  reportType: 'spam' | 'harassment' | 'inappropriate' | 'fake_scam' | 'violence' | 'other';
  description: string;
  images?: string[]; // Array of image URLs
}

export interface UpdateReportData {
  status?: 'pending' | 'resolved' | 'dismissed';
  action?: 'delete' | 'keep' | 'dismiss';
  actionReason?: string;
  description?: string;
  images?: string[];
}

export interface ReportFilters {
  status?: string;
  page?: number;
  limit?: number;
}

/**
 * Get all reports with optional filters
 */
export async function getReports(filters: ReportFilters = {}): Promise<ReportResponse> {
  try {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await fetch(`/api/reports?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to fetch reports',
      };
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch reports',
    };
  }
}

/**
 * Get a single report by ID
 */
export async function getReportById(id: string): Promise<ReportResponse> {
  try {
    const response = await fetch(`/api/reports/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to fetch report',
      };
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching report:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch report',
    };
  }
}

/**
 * Create a new report
 */
export async function createReport(reportData: CreateReportData): Promise<ReportResponse> {
  try {
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to create report',
      };
    }

    return data;
  } catch (error: any) {
    console.error('Error creating report:', error);
    return {
      success: false,
      error: error.message || 'Failed to create report',
    };
  }
}

/**
 * Update a report
 */
export async function updateReport(id: string, reportData: UpdateReportData): Promise<ReportResponse> {
  try {
    const response = await fetch(`/api/reports/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to update report',
      };
    }

    return data;
  } catch (error: any) {
    console.error('Error updating report:', error);
    return {
      success: false,
      error: error.message || 'Failed to update report',
    };
  }
}

/**
 * Delete a report
 */
export async function deleteReport(id: string): Promise<ReportResponse> {
  try {
    const response = await fetch(`/api/reports/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to delete report',
      };
    }

    return data;
  } catch (error: any) {
    console.error('Error deleting report:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete report',
    };
  }
}

/**
 * Upload a report image
 */
export async function uploadReportImage(file: File): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/reports/upload-image', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to upload image',
      };
    }

    return {
      success: true,
      imageUrl: data.imageUrl,
    };
  } catch (error: any) {
    console.error('Error uploading report image:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload image',
    };
  }
}

