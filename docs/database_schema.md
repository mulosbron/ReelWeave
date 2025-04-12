# Database Schema: Arweave-based IMDB-like Platform

## Overview

This document outlines the database schema for our Arweave-based IMDB-like platform. Since Arweave is a blockchain-based storage solution rather than a traditional database, we'll be using a tagging system to organize and query data. Each piece of data will be stored as a transaction on the Arweave blockchain with specific tags that allow for efficient retrieval via GraphQL queries.

## Data Models

### 1. Movie Data Model

Movies are the core content of our platform. Each movie is stored as a JSON object in an Arweave transaction.

**Transaction Content (JSON):**
```json
{
  "id": "unique_movie_id",
  "title": "Movie Title",
  "originalTitle": "Original Title (if different)",
  "year": 2023,
  "duration": 120, // in minutes
  "ageRating": "PG-13",
  "imdbRating": 8.5,
  "imdbVotes": 10000,
  "plot": "Short description of the movie plot",
  "posterUrl": "arweave_transaction_id_for_poster_image",
  "genres": ["Action", "Adventure", "Sci-Fi"],
  "directors": ["Director Name"],
  "writers": ["Writer Name"],
  "actors": ["Actor Name 1", "Actor Name 2"],
  "language": "English",
  "country": "USA",
  "awards": "Awards information",
  "imdbId": "tt1234567", // Original IMDB ID for reference
  "metascore": 75,
  "boxOffice": "$100,000,000",
  "production": "Production Company",
  "website": "https://movie-website.com",
  "timestamp": 1649712000000 // When the data was added
}
```

**Transaction Tags:**
```
Content-Type: application/json
App-Name: ArweaveIMDB
Type: movie
Movie-ID: unique_movie_id
Title: Movie Title
Year: 2023
Genres: Action,Adventure,Sci-Fi
IMDb-Rating: 8.5
```

### 2. User Profile Model

User profiles are linked to ArConnect wallet addresses and contain user preferences and settings.

**Transaction Content (JSON):**
```json
{
  "username": "user_display_name",
  "bio": "User biography or description",
  "avatarUrl": "arweave_transaction_id_for_avatar_image",
  "preferences": {
    "favoriteGenres": ["Action", "Comedy"],
    "contentLanguages": ["English", "Spanish"],
    "emailNotifications": false,
    "privacySettings": {
      "showWatchlist": true,
      "showRatings": true
    }
  },
  "joinedTimestamp": 1649712000000
}
```

**Transaction Tags:**
```
Content-Type: application/json
App-Name: ArweaveIMDB
Type: user-profile
Owner: USER_WALLET_ADDRESS
Username: user_display_name
```

### 3. Watchlist Model

Watchlists are collections of movies that users want to watch or have watched.

**Transaction Content (JSON):**
```json
{
  "id": "unique_watchlist_id",
  "name": "Watchlist Name",
  "description": "Watchlist description",
  "isPublic": true,
  "movies": [
    {
      "movieId": "movie_id_1",
      "addedTimestamp": 1649712000000,
      "status": "watched", // or "want-to-watch"
      "personalNotes": "User notes about this movie"
    },
    {
      "movieId": "movie_id_2",
      "addedTimestamp": 1649712000000,
      "status": "want-to-watch",
      "personalNotes": ""
    }
  ],
  "createdTimestamp": 1649712000000,
  "updatedTimestamp": 1649712000000
}
```

**Transaction Tags:**
```
Content-Type: application/json
App-Name: ArweaveIMDB
Type: watchlist
Watchlist-ID: unique_watchlist_id
Owner: USER_WALLET_ADDRESS
Name: Watchlist Name
Is-Public: true
```

### 4. Review Model

Reviews are user opinions and ratings for specific movies.

**Transaction Content (JSON):**
```json
{
  "id": "unique_review_id",
  "movieId": "movie_id",
  "rating": 4.5, // Scale of 0-5
  "title": "Review Title",
  "content": "Detailed review content",
  "containsSpoilers": false,
  "likes": 0, // Initial count, updated in separate transactions
  "createdTimestamp": 1649712000000,
  "updatedTimestamp": 1649712000000
}
```

**Transaction Tags:**
```
Content-Type: application/json
App-Name: ArweaveIMDB
Type: review
Review-ID: unique_review_id
Movie-ID: movie_id
Owner: USER_WALLET_ADDRESS
Rating: 4.5
```

### 5. Review Like Model

Since Arweave data is immutable, we track likes on reviews as separate transactions.

**Transaction Content (JSON):**
```json
{
  "reviewId": "review_id",
  "action": "like", // or "unlike"
  "timestamp": 1649712000000
}
```

**Transaction Tags:**
```
Content-Type: application/json
App-Name: ArweaveIMDB
Type: review-like
Review-ID: review_id
Owner: USER_WALLET_ADDRESS
Action: like
```

### 6. Movie Image Model

Movie posters and other images are stored as separate transactions.

**Transaction Content:**
Binary image data (JPEG/PNG)

**Transaction Tags:**
```
Content-Type: image/jpeg
App-Name: ArweaveIMDB
Type: movie-image
Movie-ID: movie_id
Image-Type: poster
```

## Data Relationships

In a blockchain environment like Arweave, relationships between data are maintained through references rather than traditional foreign keys. Here's how our data models relate to each other:

1. **User → Watchlists**: User wallet address is stored in the Owner tag of watchlist transactions
2. **User → Reviews**: User wallet address is stored in the Owner tag of review transactions
3. **Movie → Reviews**: Movie ID is stored in the Movie-ID tag of review transactions
4. **Watchlist → Movies**: Movie IDs are stored in the watchlist content
5. **Review → Likes**: Review ID is stored in the Review-ID tag of like transactions

## Query Patterns

### Retrieving Movies

```graphql
query {
  movies(
    tags: [
      { name: "App-Name", values: ["ArweaveIMDB"] },
      { name: "Type", values: ["movie"] },
      { name: "Genres", values: ["Action"] }
    ],
    first: 10
  ) {
    edges {
      node {
        id
        tags {
          name
          value
        }
      }
    }
  }
}
```

### Retrieving User Watchlists

```graphql
query {
  watchlists(
    tags: [
      { name: "App-Name", values: ["ArweaveIMDB"] },
      { name: "Type", values: ["watchlist"] },
      { name: "Owner", values: ["USER_WALLET_ADDRESS"] }
    ],
    first: 10
  ) {
    edges {
      node {
        id
        tags {
          name
          value
        }
      }
    }
  }
}
```

### Retrieving Movie Reviews

```graphql
query {
  reviews(
    tags: [
      { name: "App-Name", values: ["ArweaveIMDB"] },
      { name: "Type", values: ["review"] },
      { name: "Movie-ID", values: ["MOVIE_ID"] }
    ],
    first: 10
  ) {
    edges {
      node {
        id
        tags {
          name
          value
        }
      }
    }
  }
}
```

## Schema Evolution

Since Arweave data is immutable, schema evolution requires special consideration:

1. **Versioning**: Include a schema version in transaction tags to track data format changes
2. **Backward Compatibility**: Ensure new code can read old data formats
3. **Data Migration**: For major changes, create new transactions with updated data and deprecate old ones

## Optimization Strategies

1. **Tag Selection**: Carefully choose tags to optimize for common query patterns
2. **Data Chunking**: Break large datasets into manageable chunks
3. **Client-side Caching**: Cache frequently accessed data on the client
4. **Pagination**: Implement cursor-based pagination for large result sets

## Conclusion

This schema design leverages Arweave's unique properties to create a flexible, queryable data structure for our IMDB-like platform. By using a consistent tagging system and well-defined data models, we can efficiently store and retrieve movie data, user profiles, watchlists, and reviews in a decentralized manner.
