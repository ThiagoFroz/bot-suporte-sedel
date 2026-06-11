const api = {
  async post(path, body) {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    return response.json();
  },

  async get(path) {
    const response = await fetch(path);
    return response.json();
  }
};
