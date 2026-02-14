export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Lumen API',
    description: 'AI-powered "Second Brain" for physical book lovers. Transforms book snippets into searchable, AI-synthesized digital assets.',
    version: '1.0.0',
  },
  servers: [{ url: '/', description: 'API root' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Firebase ID Token',
        description: 'Firebase ID token from Firebase Auth',
      },
    },
    schemas: {
      Book: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'abc123' },
          userId: { type: 'string' },
          title: { type: 'string', example: 'Atomic Habits' },
          author: { type: 'string', example: 'James Clear' },
          isbn: { type: 'string', nullable: true },
          coverUrl: { type: 'string', format: 'uri', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Snippet: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          bookId: { type: 'string' },
          text: { type: 'string', example: 'We are what we repeatedly do...' },
          pageNumber: { type: 'integer', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      SearchResults: {
        type: 'object',
        properties: {
          keyword: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                text: { type: 'string' },
                bookId: { type: 'string' },
                score: { type: 'number' },
              },
            },
          },
          semantic: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                text: { type: 'string' },
                bookId: { type: 'string' },
                score: { type: 'number' },
              },
            },
          },
        },
      },
      ExportResult: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          format: { type: 'string', enum: ['markdown', 'notion', 'obsidian'] },
        },
      },
      SummaryResult: {
        type: 'object',
        properties: {
          executiveSummary: {
            type: 'array',
            items: { type: 'string' },
            description: '3-point executive summary',
          },
          cognitiveConnections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                snippet: { type: 'string' },
                relatedBook: { type: 'string' },
                relatedQuote: { type: 'string' },
              },
            },
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
      User: {
        type: 'object',
        properties: {
          uid: { type: 'string' },
          email: { type: 'string', nullable: true },
          displayName: { type: 'string', nullable: true },
          photoURL: { type: 'string', format: 'uri', nullable: true },
        },
      },
      SignupRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          name: { type: 'string', description: 'User display name (optional)' },
          email: { type: 'string', format: 'email', description: 'User email' },
          password: { type: 'string', minLength: 6, description: 'Password (min 6 characters)' },
          displayName: { type: 'string', description: 'Alias for name; name takes precedence if both sent' },
        },
      },
      SignupResponse: {
        type: 'object',
        properties: {
          uid: { type: 'string' },
          email: { type: 'string', nullable: true },
          displayName: { type: 'string', nullable: true },
          customToken: { type: 'string', description: 'Use signInWithCustomToken to get ID token' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', description: 'User email' },
          password: { type: 'string', description: 'User password' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          uid: { type: 'string' },
          email: { type: 'string', nullable: true },
          displayName: { type: 'string', nullable: true },
          customToken: { type: 'string', description: 'Use signInWithCustomToken to get ID token' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Returns API status. No authentication required.',
        security: [],
        responses: {
          200: {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    service: { type: 'string', example: 'lumen-api' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in',
        description: 'Verify email and password. Returns a customToken. Client must call signInWithCustomToken(customToken) to obtain an ID token for subsequent API calls.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } },
            },
          },
          400: { description: 'Invalid input (missing email/password)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Invalid email or password', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Account disabled', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Sign up',
        description: 'Create user with name, email, and password. Returns a customToken. Client must call signInWithCustomToken(customToken) to obtain an ID token for subsequent API calls.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SignupRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'User created',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SignupResponse' } },
            },
          },
          400: { description: 'Invalid input (e.g. missing email/password, weak password)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: 'Email already registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user',
        description: 'Returns current user info. Requires Bearer token.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Current user',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/User' } },
            },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/books': {
      get: {
        tags: ['Books'],
        summary: 'List books',
        description: 'List all books in the user library',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of books',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Book' } },
              },
            },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      post: {
        tags: ['Books'],
        summary: 'Create book from cover',
        description: 'Upload a book cover image; fetches metadata via Google Books API',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['cover'],
                properties: {
                  cover: { type: 'string', format: 'binary', description: 'Book cover image (JPEG/PNG)' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Book created',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Book' } },
            },
          },
          400: { description: 'Cover image required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/books/lookup': {
      post: {
        tags: ['Books'],
        summary: 'Lookup book by metadata',
        description: 'Fetch book metadata by ISBN or title+author (no image)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  isbn: { type: 'string', example: '9780735211292' },
                  title: { type: 'string' },
                  author: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Book created',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Book' } },
            },
          },
          404: { description: 'Book not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/books/{id}': {
      get: {
        tags: ['Books'],
        summary: 'Get book',
        description: 'Get a single book by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Book details',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Book' } },
            },
          },
          404: { description: 'Book not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/snippets': {
      get: {
        tags: ['Snippets'],
        summary: 'List snippets',
        description: 'List user snippets, optionally filtered by book',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'bookId', in: 'query', schema: { type: 'string' }, description: 'Filter by book ID' },
        ],
        responses: {
          200: {
            description: 'List of snippets',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Snippet' } },
              },
            },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      post: {
        tags: ['Snippets'],
        summary: 'Create snippet',
        description: 'Create snippet from raw text or image (OCR). Multipart: image file + bookId, text (optional), pageNumber (optional).',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['bookId'],
                properties: {
                  bookId: { type: 'string', description: 'Book ID' },
                  text: { type: 'string', description: 'Raw text (if no image)' },
                  pageNumber: { type: 'integer', description: 'Page number' },
                  image: { type: 'string', format: 'binary', description: 'Image for OCR' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Snippet created',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Snippet' } },
            },
          },
          400: { description: 'bookId required, and either text or image', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/snippets/{id}': {
      patch: {
        tags: ['Snippets'],
        summary: 'Update snippet',
        description: 'Update snippet text (e.g. OCR correction)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text'],
                properties: { text: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Snippet updated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Snippet' } },
            },
          },
          400: { description: 'text required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Snippet not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Snippets'],
        summary: 'Delete snippet',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          204: { description: 'Snippet deleted' },
          404: { description: 'Snippet not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/search': {
      get: {
        tags: ['Search'],
        summary: 'Search snippets',
        description: 'Global search across all user snippets (keyword + semantic/fuzzy)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' }, description: 'Search query' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Max results (1-100)' },
        ],
        responses: {
          200: {
            description: 'Search results',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SearchResults' } },
            },
          },
          400: { description: 'Query parameter q required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/export': {
      get: {
        tags: ['Export'],
        summary: 'Export snippets',
        description: 'Export snippets to Markdown, Notion, or Obsidian format',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['markdown', 'notion', 'obsidian'], default: 'markdown' } },
          { name: 'bookId', in: 'query', schema: { type: 'string' }, description: 'Filter by book ID' },
        ],
        responses: {
          200: {
            description: 'Export result',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ExportResult' } },
            },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/ai/tts': {
      post: {
        tags: ['AI'],
        summary: 'Neural TTS',
        description: 'Convert summary or snippets to high-quality .mp3. PRD 3.4 – 3 narrator voices: academic, conversational, calming.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  text: { type: 'string', description: 'Raw text to speak (optional)' },
                  source: { type: 'string', enum: ['summary', 'snippets'], description: 'Use AI summary or snippet text' },
                  bookId: { type: 'string', description: 'Filter snippets by book' },
                  snippetIds: { type: 'array', items: { type: 'string' }, description: 'Specific snippet IDs' },
                  voice: { type: 'string', enum: ['academic', 'conversational', 'calming'], default: 'conversational' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Audio URL',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    audioUrl: { type: 'string', format: 'uri' },
                    durationSeconds: { type: 'number', nullable: true },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/ai/summarize': {
      post: {
        tags: ['AI'],
        summary: 'Mirror synthesis',
        description: 'Get 3-point executive summary + cognitive connections between books. Uses all user snippets if bookId/snippetIds omitted.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  bookId: { type: 'string', description: 'Limit to snippets from this book' },
                  snippetIds: { type: 'array', items: { type: 'string' }, description: 'Specific snippet IDs' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Summary and connections',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SummaryResult' } },
            },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
  },
} as const;
