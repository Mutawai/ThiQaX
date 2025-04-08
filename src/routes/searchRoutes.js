// src/routes/searchRoutes.js
const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');

// Validation schemas
const jobSearchSchema = {
  keywords: {
    in: ['query'],
    optional: true,
    isString: true,
    trim: true
  },
  location: {
    in: ['query'],
    optional: true,
    isString: true,
    trim: true
  },
  salary: {
    in: ['query'],
    optional: true,
    custom: {
      options: (value) => {
        const range = value.split('-');
        if (range.length !== 2) return false;
        return !isNaN(range[0]) && !isNaN(range[1]);
      },
      errorMessage: 'Salary must be in format min-max'
    }
  },
  jobType: {
    in: ['query'],
    optional: true,
    isArray: {
      errorMessage: 'Job type must be an array'
    }
  },
  'jobType.*': {
    in: ['query'],
    optional: true,
    isIn: {
      options: [['FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY']],
      errorMessage: 'Invalid job type'
    }
  },
  industry: {
    in: ['query'],
    optional: true,
    isArray: {
      errorMessage: 'Industry must be an array'
    }
  },
  page: {
    in: ['query'],
    optional: true,
    isInt: {
      options: { min: 1 },
      errorMessage: 'Page must be a positive integer'
    },
    toInt: true
  },
  limit: {
    in: ['query'],
    optional: true,
    isInt: {
      options: { min: 1, max: 50 },
      errorMessage: 'Limit must be between 1 and 50'
    },
    toInt: true
  },
  sortBy: {
    in: ['query'],
    optional: true,
    isIn: {
      options: [['date', 'salary', 'relevance']],
      errorMessage: 'Sort must be one of: date, salary, relevance'
    }
  },
  sortOrder: {
    in: ['query'],
    optional: true,
    isIn: {
      options: [['asc', 'desc']],
      errorMessage: 'Sort order must be asc or desc'
    }
  }
};

const userSearchSchema = {
  keywords: {
    in: ['query'],
    optional: true,
    isString: true,
    trim: true
  },
  skills: {
    in: ['query'],
    optional: true,
    isArray: {
      errorMessage: 'Skills must be an array'
    }
  },
  experience: {
    in: ['query'],
    optional: true,
    isInt: {
      options: { min: 0 },
      errorMessage: 'Experience must be a non-negative integer'
    },
    toInt: true
  },
  location: {
    in: ['query'],
    optional: true,
    isString: true,
    trim: true
  },
  availability: {
    in: ['query'],
    optional: true,
    isIn: {
      options: [['IMMEDIATE', 'TWO_WEEKS', 'ONE_MONTH', 'CUSTOM']],
      errorMessage: 'Invalid availability value'
    }
  },
  verifiedOnly: {
    in: ['query'],
    optional: true,
    isBoolean: {
      errorMessage: 'Verified only must be a boolean'
    },
    toBoolean: true
  },
  page: {
    in: ['query'],
    optional: true,
    isInt: {
      options: { min: 1 },
      errorMessage: 'Page must be a positive integer'
    },
    toInt: true
  },
  limit: {
    in: ['query'],
    optional: true,
    isInt: {
      options: { min: 1, max: 50 },
      errorMessage: 'Limit must be between 1 and 50'
    },
    toInt: true
  }
};

/**
 * @swagger
 * /api/v1/search/jobs:
 *   get:
 *     summary: Search for jobs with various filters
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: keywords
 *         schema:
 *           type: string
 *         description: Search keywords
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Job location
 *       - in: query
 *         name: salary
 *         schema:
 *           type: string
 *         description: Salary range (format min-max)
 *       - in: query
 *         name: jobType
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [FULL_TIME, PART_TIME, CONTRACT, TEMPORARY]
 *         description: Types of employment
 *       - in: query
 *         name: industry
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Industries to filter by
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [date, salary, relevance]
 *           default: date
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of jobs matching the search criteria
 */
router.get(
  '/jobs',
  validateRequest(jobSearchSchema),
  searchController.searchJobs
);

/**
 * @swagger
 * /api/v1/search/jobs/filters:
 *   get:
 *     summary: Get available filter options for job search
 *     tags: [Search]
 *     responses:
 *       200:
 *         description: Available filter options
 */
router.get(
  '/jobs/filters',
  searchController.getJobFilterOptions
);

/**
 * @swagger
 * /api/v1/search/jobs/trending:
 *   get:
 *     summary: Get trending job searches and popular categories
 *     tags: [Search]
 *     responses:
 *       200:
 *         description: Trending job searches and categories
 */
router.get(
  '/jobs/trending',
  searchController.getTrendingJobSearches
);

/**
 * @swagger
 * /api/v1/search/users/candidates:
 *   get:
 *     summary: Search for job candidates (restricted to agents and sponsors)
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keywords
 *         schema:
 *           type: string
 *         description: Search keywords
 *       - in: query
 *         name: skills
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Required skills
 *       - in: query
 *         name: experience
 *         schema:
 *           type: integer
 *         description: Minimum years of experience
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Candidate location
 *       - in: query
 *         name: availability
 *         schema:
 *           type: string
 *           enum: [IMMEDIATE, TWO_WEEKS, ONE_MONTH, CUSTOM]
 *         description: Candidate availability
 *       - in: query
 *         name: verifiedOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Only show verified candidates
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: List of candidates matching the search criteria
 *       401:
 *         description: Not authorized
 */
router.get(
  '/users/candidates',
  protect,
  authorize('agent', 'sponsor'),
  validateRequest(userSearchSchema),
  searchController.searchCandidates
);

/**
 * @swagger
 * /api/v1/search/users/agents:
 *   get:
 *     summary: Search for recruitment agents (restricted to sponsors and job seekers)
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keywords
 *         schema:
 *           type: string
 *         description: Search keywords
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Agent specializations
 *       - in: query
 *         name: rating
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *         description: Minimum agent rating
 *       - in: query
 *         name: verifiedOnly
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Only show verified agents
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: List of agents matching the search criteria
 *       401:
 *         description: Not authorized
 */
router.get(
  '/users/agents',
  protect,
  authorize('sponsor', 'jobSeeker'),
  searchController.searchAgents
);

/**
 * @swagger
 * /api/v1/search/users/sponsors:
 *   get:
 *     summary: Search for sponsors/employers (restricted to agents and job seekers)
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keywords
 *         schema:
 *           type: string
 *         description: Search keywords
 *       - in: query
 *         name: industry
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Sponsor industries
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Sponsor country
 *       - in: query
 *         name: verifiedOnly
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Only show verified sponsors
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: List of sponsors matching the search criteria
 *       401:
 *         description: Not authorized
 */
router.get(
  '/users/sponsors',
  protect,
  authorize('agent', 'jobSeeker'),
  searchController.searchSponsors
);

/**
 * @swagger
 * /api/v1/search/autocomplete:
 *   get:
 *     summary: Get autocomplete suggestions for search
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Partial search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [job, location, skill, company]
 *           default: job
 *         description: Type of autocomplete suggestion
 *     responses:
 *       200:
 *         description: List of autocomplete suggestions
 */
router.get(
  '/autocomplete',
  searchController.getAutocompleteSuggestions
);

/**
 * @swagger
 * /api/v1/search/skills:
 *   get:
 *     summary: Search for skills
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Skill search query
 *     responses:
 *       200:
 *         description: List of skills matching the query
 */
router.get(
  '/skills',
  searchController.searchSkills
);

/**
 * @swagger
 * /api/v1/search/locations:
 *   get:
 *     summary: Search for locations
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Location search query
 *     responses:
 *       200:
 *         description: List of locations matching the query
 */
router.get(
  '/locations',
  searchController.searchLocations
);

module.exports = router;
