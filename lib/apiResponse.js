export class ApiResponse {
  static success(data = null, message = 'Success', status = 200) {
    return new Response(JSON.stringify({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    }), {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  static error(message = 'Internal Server Error', status = 500, errors = null) {
    return new Response(JSON.stringify({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    }), {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  static validationError(errors) {
    return this.error('Validation Error', 400, errors);
  }

  static notFound(message = 'Resource not found') {
    return this.error(message, 404);
  }

  static unauthorized(message = 'Unauthorized') {
    return this.error(message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return this.error(message, 403);
  }

  static created(data = null, message = 'Created successfully') {
    return this.success(data, message, 201);
  }

  static noContent(message = 'Deleted successfully') {
    return new Response(null, {
      status: 204,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export function getValidatedFields(data, allowedFields) {
  const result = {};
  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      result[field] = data[field];
    }
  });
  return result;
}