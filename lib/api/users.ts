import type { UserProfile, UpdateProfilePayload } from '@/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://staging-api.cartzii.com';

interface ProfileSuccessResponse {
  success: number;
  message: string;
  data: UserProfile;
}

interface ErrorResponse {
  errorCode: number;
  message?: string;
  error?: string;
}

type ProfileUpdateResponse = ProfileSuccessResponse | ErrorResponse;

function isErrorResponse(res: unknown): res is ErrorResponse {
  return typeof res === 'object' && res !== null && 'errorCode' in res;
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('cartzii-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch user profile via GET /api/v1/getUser/:userid
 */
export async function fetchUserProfile(
  userId: number,
): Promise<{ data?: UserProfile; error?: string }> {
  const token = getAuthToken();
  if (!token) return { error: 'Not authenticated' };

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/getUser/${userId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return { error: 'Server error. Please try again.' };
    }

    const json = await res.json();

    if (isErrorResponse(json)) {
      return { error: json.message || json.error || 'Failed to fetch profile' };
    }

    return { data: json.data ?? json };
  } catch {
    return { error: 'Network error. Please try again.' };
  }
}

/**
 * Update user profile via PUT /api/v1/users/:id
 * Uses multipart/form-data to support profile picture uploads.
 */
export async function updateUserProfile(
  userId: number,
  payload: UpdateProfilePayload,
): Promise<{ data?: UserProfile; error?: string }> {
  const token = getAuthToken();
  if (!token) return { error: 'Not authenticated' };

  const formData = new FormData();

  // Append only provided fields
  if (payload.firstname !== undefined) formData.append('firstname', payload.firstname);
  if (payload.lastname !== undefined) formData.append('lastname', payload.lastname);
  if (payload.email !== undefined) formData.append('email', payload.email);
  if (payload.password !== undefined) formData.append('password', payload.password);
  if (payload.phonenumber !== undefined) formData.append('phonenumber', payload.phonenumber);
  if (payload.gender !== undefined) formData.append('gender', payload.gender);
  if (payload.dateofbirth !== undefined) formData.append('dateofbirth', payload.dateofbirth);
  if (payload.profilepicture) formData.append('profilepicture', payload.profilepicture);

  // Do NOT set Content-Type — the browser will set it with the boundary
  const res = await fetch(`${API_BASE_URL}/api/v1/users/${userId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    return { error: 'Server error. Please try again.' };
  }

  const json: ProfileUpdateResponse = await res.json();

  if (isErrorResponse(json)) {
    return { error: json.message || json.error || 'Failed to update profile' };
  }

  return { data: json.data };
}
