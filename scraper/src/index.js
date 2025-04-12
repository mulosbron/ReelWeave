// index.js - Main entry point for the IMDB scraper
import puppeteer from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';
import Arweave from 'arweave';
import dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';
import path from 'path';

// Setup logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ level, message, timestamp }) => {
      return `${timestamp} ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'scraper.log' })
  ]
});

// Load environment variables
dotenv.config();

// Initialize Arweave client
const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create output directory for scraped data
const outputDir = path.join(__dirname, '../data');
try {
  await fs.mkdir(outputDir, { recursive: true });
  logger.info(`Created output directory: ${outputDir}`);
} catch (error) {
  logger.error(`Error creating output directory: ${error.message}`);
}

/**
 * Main function to scrape IMDB data
 */
async function scrapeIMDB() {
  logger.info('Starting IMDB scraper');
  
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport size
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to IMDB Top 250 page
    logger.info('Navigating to IMDB Top 250 page');
    await page.goto('https://www.imdb.com/chart/top/', { waitUntil: 'networkidle2' });
    
    // Extract movie data
    logger.info('Extracting movie data from Top 250 page');
    const movies = await page.evaluate(() => {
      const movieElements = document.querySelectorAll('.ipc-metadata-list-summary-item');
      
      return Array.from(movieElements).map(movie => {
        // Extract title
        const titleElement = movie.querySelector('.ipc-title__text');
        const fullTitle = titleElement ? titleElement.textContent.trim() : '';
        // Title format is typically "1. The Shawshank Redemption", so we remove the rank
        const title = fullTitle.substring(fullTitle.indexOf(' ') + 1);
        
        // Extract year
        const yearElement = movie.querySelector('.cli-title-metadata > span:first-child');
        const year = yearElement ? parseInt(yearElement.textContent.trim()) : null;
        
        // Extract duration
        const durationElement = movie.querySelector('.cli-title-metadata > span:nth-child(2)');
        const durationText = durationElement ? durationElement.textContent.trim() : '';
        // Duration format is typically "2h 22m", convert to minutes
        let duration = 0;
        if (durationText) {
          const hours = durationText.includes('h') ? parseInt(durationText.split('h')[0]) : 0;
          const minutes = durationText.includes('m') ? 
            parseInt(durationText.includes('h') ? 
              durationText.split('h')[1].replace('m', '').trim() : 
              durationText.replace('m', '').trim()) : 0;
          duration = hours * 60 + minutes;
        }
        
        // Extract rating
        const ratingElement = movie.querySelector('.ipc-rating-star--imdb');
        const rating = ratingElement ? 
          parseFloat(ratingElement.textContent.trim().split(' ')[0]) : null;
        
        // Extract poster URL
        const posterElement = movie.querySelector('img.ipc-image');
        const posterUrl = posterElement ? posterElement.src : '';
        
        // Extract IMDB ID from the link
        const linkElement = movie.querySelector('a');
        const link = linkElement ? linkElement.href : '';
        const imdbId = link.match(/\/title\/(tt\d+)/)?.[1] || '';
        
        return {
          id: uuidv4(),
          title,
          year,
          duration,
          imdbRating: rating,
          posterUrl,
          imdbId,
          timestamp: Date.now()
        };
      });
    });
    
    logger.info(`Extracted data for ${movies.length} movies`);
    
    // Save data to JSON file
    const outputFile = path.join(outputDir, 'imdb_top250.json');
    await fs.writeFile(outputFile, JSON.stringify(movies, null, 2));
    logger.info(`Saved movie data to ${outputFile}`);
    
    // Get detailed information for each movie
    logger.info('Starting to fetch detailed information for each movie');
    const moviesWithDetails = [];
    
    for (let i = 0; i < Math.min(movies.length, 10); i++) { // Limit to 10 movies for testing
      const movie = movies[i];
      logger.info(`Fetching details for movie ${i+1}/${Math.min(movies.length, 10)}: ${movie.title}`);
      
      try {
        // Navigate to movie page
        await page.goto(`https://www.imdb.com/title/${movie.imdbId}/`, { waitUntil: 'networkidle2' });
        
        // Extract additional details
        const details = await page.evaluate(() => {
          // Extract genres
          const genreElements = document.querySelectorAll('[data-testid="genres"] a');
          const genres = Array.from(genreElements).map(el => el.textContent.trim());
          
          // Extract plot
          const plotElement = document.querySelector('[data-testid="plot"]');
          const plot = plotElement ? plotElement.textContent.trim() : '';
          
          // Extract directors
          const directorElements = document.querySelectorAll('[data-testid="title-pc-principal-credit"]:first-child a');
          const directors = Array.from(directorElements).map(el => el.textContent.trim());
          
          // Extract actors
          const actorElements = document.querySelectorAll('[data-testid="title-cast-item__actor"]');
          const actors = Array.from(actorElements).map(el => el.textContent.trim());
          
          // Extract age rating
          const ageRatingElement = document.querySelector('[data-testid="storyline-certificate"]');
          const ageRating = ageRatingElement ? ageRatingElement.textContent.trim() : '';
          
          return {
            genres,
            plot,
            directors,
            actors,
            ageRating
          };
        });
        
        // Merge basic movie data with details
        const movieWithDetails = {
          ...movie,
          ...details
        };
        
        moviesWithDetails.push(movieWithDetails);
      } catch (error) {
        logger.error(`Error fetching details for ${movie.title}: ${error.message}`);
        // Continue with next movie even if this one fails
        moviesWithDetails.push(movie);
      }
    }
    
    // Save detailed data to JSON file
    const detailedOutputFile = path.join(outputDir, 'imdb_top250_detailed.json');
    await fs.writeFile(detailedOutputFile, JSON.stringify(moviesWithDetails, null, 2));
    logger.info(`Saved detailed movie data to ${detailedOutputFile}`);
    
    // Upload data to Arweave (mock implementation)
    logger.info('Uploading movie data to Arweave (mock implementation)');
    for (const movie of moviesWithDetails) {
      try {
        // Prepare tags for Arweave transaction
        const tags = [
          { name: 'Content-Type', value: 'application/json' },
          { name: 'App-Name', value: 'ArweaveIMDB' },
          { name: 'Type', value: 'movie' },
          { name: 'Movie-ID', value: movie.id },
          { name: 'Title', value: movie.title },
          { name: 'Year', value: movie.year.toString() }
        ];
        
        if (movie.genres && movie.genres.length > 0) {
          tags.push({ name: 'Genres', value: movie.genres.join(',') });
        }
        
        if (movie.imdbRating) {
          tags.push({ name: 'IMDb-Rating', value: movie.imdbRating.toString() });
        }
        
        // In a real implementation, you would use a wallet key file to sign transactions
        // For this example, we'll just log what would happen
        logger.info(`Would upload movie "${movie.title}" to Arweave with tags: ${JSON.stringify(tags)}`);
        
        // Create transaction (mock)
        // const tx = await arweave.createTransaction({
        //   data: JSON.stringify(movie)
        // });
        
        // Add tags
        // tags.forEach(tag => {
        //   tx.addTag(tag.name, tag.value);
        // });
        
        // Sign and post transaction
        // await arweave.transactions.sign(tx, wallet);
        // const response = await arweave.transactions.post(tx);
        
        logger.info(`Mock transaction created for movie: ${movie.title}`);
      } catch (error) {
        logger.error(`Error uploading movie ${movie.title} to Arweave: ${error.message}`);
      }
    }
    
    logger.info('IMDB scraping completed successfully');
  } catch (error) {
    logger.error(`Error during IMDB scraping: ${error.message}`);
  } finally {
    await browser.close();
    logger.info('Browser closed');
  }
}

// Run the scraper
scrapeIMDB().catch(error => {
  logger.error(`Unhandled error in scraper: ${error.message}`);
  process.exit(1);
});
