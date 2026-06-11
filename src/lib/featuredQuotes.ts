export type FeaturedQuote = {
  quote: string
  highlight: string
  author: string
  source: string
  name: 'Miles' | 'Gus' | 'Henry' | 'Noah'
}

// A pool of real literary/historical quotes that happen to contain
// 'Miles', 'Gus' (via Augustus), 'Henry', or 'Noah' -- one is shown at random
// on the home page, with no-repeat tracking in localStorage.
export const FEATURED_QUOTES: FeaturedQuote[] = [
  { quote: "In the Old Colony days, in Plymouth the land of the Pilgrims, To and fro in a room of his simple and primitive dwelling, Clad in doublet and hose, and boots of Cordovan leather, Strode, with a martial air, Miles Standish the Puritan Captain.", highlight: "Miles", author: "Henry Wadsworth Longfellow", source: "The Courtship of Miles Standish, Part I: Miles Standish", name: 'Miles' },
  { quote: "Yes; Miles Standish was dead!--an Indian had brought them the tidings,-- Slain by a poisoned arrow, shot down in the front of the battle, Into an ambush beguiled, cut off with the whole of his forces; All the town would be burned, and all the people be murdered!", highlight: "Miles", author: "Henry Wadsworth Longfellow", source: "The Courtship of Miles Standish, Part VIII: The Spinning-Wheel", name: 'Miles' },
  { quote: "Ask no permission of Miles Hendon for aught thou cravest.", highlight: "Miles", author: "Mark Twain", source: "The Prince and the Pauper, Ch. XII", name: 'Miles' },
  { quote: "Miles Hendon and Tom Canty were favourites of the King, all through his brief reign, and his sincere mourners when he died.", highlight: "Miles", author: "Mark Twain", source: "The Prince and the Pauper, Conclusion", name: 'Miles' },
  { quote: "The river looked miles and miles across.", highlight: "miles", author: "Mark Twain", source: "Adventures of Huckleberry Finn, Ch. VII", name: 'Miles' },
  { quote: "It had the big timber of a regular island; it might be five or six miles long and more than half a mile wide.", highlight: "miles", author: "Mark Twain", source: "Adventures of Huckleberry Finn, Ch. XV", name: 'Miles' },
  { quote: "\u201cI wonder how many miles I\u2019ve fallen by this time?\u201d she said aloud.", highlight: "miles", author: "Lewis Carroll", source: "Alice's Adventures in Wonderland, Ch. I", name: 'Miles' },
  { quote: "\u201cNearly two miles high,\u201d added the Queen.", highlight: "miles", author: "Lewis Carroll", source: "Alice's Adventures in Wonderland, Ch. VIII", name: 'Miles' },
  { quote: "He will be in Exeter, miles away, probably working at papers of the law with my other friend, Peter Hawkins.", highlight: "miles", author: "Bram Stoker", source: "Dracula, Ch. I", name: 'Miles' },
  { quote: "We have something more than 70 miles before us.", highlight: "miles", author: "Bram Stoker", source: "Dracula, Ch. I", name: 'Miles' },
  { quote: "Away to the south-west of us we saw two low hills, about a couple of miles apart, and rising behind one of them a third and higher hill, whose peak was still buried in the fog.", highlight: "miles", author: "Robert Louis Stevenson", source: "Treasure Island, Ch. XII", name: 'Miles' },
  { quote: "Three miles farther, just inside the mouth of North Inlet, what should we meet but the HISPANIOLA, cruising by herself?", highlight: "miles", author: "Robert Louis Stevenson", source: "Treasure Island, Ch. XXIII", name: 'Miles' },
  { quote: "On the 20th of July, 1866, the steamer Governor Higginson, of the Calcutta and Burnach Steam Navigation Company, had met this moving mass five miles off the east coast of Australia.", highlight: "miles", author: "Jules Verne", source: "Twenty Thousand Leagues Under the Sea, Ch. I", name: 'Miles' },
  { quote: "What passes in those remote depths\u2014what beings live, or can live, twelve or fifteen miles beneath the surface of the waters\u2014what is the organisation of these animals, we can scarcely conjecture.", highlight: "miles", author: "Jules Verne", source: "Twenty Thousand Leagues Under the Sea, Ch. I", name: 'Miles' },
  { quote: "When I came down from my apartment in the tree, I looked about me again, and the first thing I found was the boat, which lay, as the wind and the sea had tossed her up, upon the land, about two miles on my right hand.", highlight: "miles", author: "Daniel Defoe", source: "Robinson Crusoe", name: 'Miles' },
  { quote: "I saw some pieces of the wreck blown on shore, at a great distance, near two miles off me, but resolved to see what they were, and found it was a piece of the head, but too heavy for me to bring away.", highlight: "miles", author: "Daniel Defoe", source: "Robinson Crusoe", name: 'Miles' },
  { quote: "Augustus was accustomed to boast that he had found his capital of brick, and that he had left it of marble.", highlight: "Augustus", author: "Edward Gibbon", source: "The History of the Decline and Fall of the Roman Empire, Ch. II", name: 'Gus' },
  { quote: "It was dangerous to trust the sincerity of Augustus; to seem to distrust it was still more dangerous.", highlight: "Augustus", author: "Edward Gibbon", source: "The History of the Decline and Fall of the Roman Empire, Ch. III", name: 'Gus' },
  { quote: "Augustus was born A.U.C. 691, and died A.U.C. 766.", highlight: "Augustus", author: "Suetonius", source: "The Lives of the Twelve Caesars: Augustus", name: 'Gus' },
  { quote: "It is generally supposed that the Aeneid was written at the particular desire of Augustus, who was ambitious of having the Julian family represented as lineal descendants of the Trojan Aeneas.", highlight: "Augustus", author: "Suetonius", source: "The Lives of the Twelve Caesars: Augustus", name: 'Gus' },
  { quote: "Afterwards Quintilis received the name of Julius, from Caesar who defeated Pompey; as also Sextilis that of Augustus, from the second Caesar, who had that title.", highlight: "Augustus", author: "Plutarch", source: "Plutarch's Lives: Numa", name: 'Gus' },
  { quote: "Galba was also akin to Livia, the wife of Augustus, by whose interest he was preferred to the consulship by the emperor.", highlight: "Augustus", author: "Plutarch", source: "Plutarch's Lives: Galba", name: 'Gus' },
  { quote: "But next behold the youth of form divine, Caesar himself, exalted in his line; Augustus, promis\u2019d oft, and long foretold, Sent to the realm that Saturn rul\u2019d of old; Born to restore a better age of gold.", highlight: "Augustus", author: "Virgil (trans. John Dryden)", source: "The Aeneid, Book VI", name: 'Gus' },
  { quote: "So Caius came out in a solemn manner, and offered sacrifice to Augustus C\u00e6sar, in whose honor indeed these shows were celebrated.", highlight: "Augustus", author: "Flavius Josephus", source: "Antiquities of the Jews, Book XIX", name: 'Gus' },
  { quote: "I think it also very just that no Grecian city should be deprived of such rights and privileges, since they were preserved to them under the great Augustus.", highlight: "Augustus", author: "Flavius Josephus", source: "Antiquities of the Jews, Book XVI", name: 'Gus' },
  { quote: "Two stars keep not their motion in one sphere, Nor can one England brook a double reign Of Henry Percy and the Prince of Wales.", highlight: "Henry", author: "William Shakespeare", source: "Henry IV, Part 1, Act V, Scene IV", name: 'Henry' },
  { quote: "O Henry, thou hast robb'd me of my youth!", highlight: "Henry", author: "William Shakespeare", source: "Henry IV, Part 1, Act V, Scene IV", name: 'Henry' },
  { quote: "The game's afoot: Follow your spirit; and upon this charge Cry 'God for Henry, England, and Saint George!'", highlight: "Henry", author: "William Shakespeare", source: "Henry V, Act III, Scene I", name: 'Henry' },
  { quote: "Then shall our names, Familiar in his mouth as household words- Henry the King, Bedford and Exeter, Warwick and Talbot, Salisbury and Gloucester- Be in their flowing cups freshly rememb'red.", highlight: "Henry", author: "William Shakespeare", source: "Henry V, Act IV, Scene III", name: 'Henry' },
  { quote: "Henry Tilney and his father, joining a party in the opposite box, recalled her to anxiety and distress.", highlight: "Henry", author: "Jane Austen", source: "Northanger Abbey, Ch. 8", name: 'Henry' },
  { quote: "Heaven forbid that Henry Tilney should ever know her folly!", highlight: "Henry", author: "Jane Austen", source: "Northanger Abbey, Ch. 24", name: 'Henry' },
  { quote: "Henry is different; he loves to be doing.", highlight: "Henry", author: "Jane Austen", source: "Mansfield Park, Ch. 5", name: 'Henry' },
  { quote: "Henry Crawford had destroyed her happiness, but he should not know that he had done it; he should not destroy her credit, her appearance, her prosperity, too.", highlight: "Henry", author: "Jane Austen", source: "Mansfield Park, Ch. 48", name: 'Henry' },
  { quote: "Henry Clerval was the son of a merchant of Geneva.", highlight: "Henry", author: "Mary Shelley", source: "Frankenstein, Ch. 2", name: 'Henry' },
  { quote: "During all that time Henry was my only nurse.", highlight: "Henry", author: "Mary Shelley", source: "Frankenstein, Ch. 5", name: 'Henry' },
  { quote: "Henry Dashwood, the legal inheritor of the Norland estate, and the person to whom he intended to bequeath it.", highlight: "Henry", author: "Jane Austen", source: "Sense and Sensibility, Ch. 1", name: 'Henry' },
  { quote: "Henry Dashwood had one son: by his present lady, three daughters.", highlight: "Henry", author: "Jane Austen", source: "Sense and Sensibility, Ch. 1", name: 'Henry' },
  { quote: "\u201cIt is your best work, Basil, the best thing you have ever done,\u201d said Lord Henry languidly.", highlight: "Henry", author: "Oscar Wilde", source: "The Picture of Dorian Gray, Ch. 1", name: 'Henry' },
  { quote: "\u201cYou must introduce me now,\u201d cried Lord Henry, laughing.", highlight: "Henry", author: "Oscar Wilde", source: "The Picture of Dorian Gray, Ch. 1", name: 'Henry' },
  { quote: "Henry is the last of the Baskervilles.", highlight: "Henry", author: "Arthur Conan Doyle", source: "The Hound of the Baskervilles, Ch. 4", name: 'Henry' },
  { quote: "Sir Henry Baskerville listened with the deepest attention and with an occasional exclamation of surprise.", highlight: "Henry", author: "Arthur Conan Doyle", source: "The Hound of the Baskervilles, Ch. 14", name: 'Henry' },
  { quote: "But Noah found grace in the eyes of the LORD.", highlight: "Noah", author: "King James Bible", source: "Genesis 6:8", name: 'Noah' },
  { quote: "And the LORD said unto Noah, Come thou and all thy house into the ark; for thee have I seen righteous before me in this generation.", highlight: "Noah", author: "King James Bible", source: "Genesis 7:1", name: 'Noah' },
  { quote: "\u201cI\u2019m Mister Noah Claypole,\u201d said the charity-boy, \u201cand you\u2019re under me.\u201d", highlight: "Noah", author: "Charles Dickens", source: "Oliver Twist, Ch. 5", name: 'Noah' },
  { quote: "Noah Claypole lolled negligently in an easy-chair, with his legs thrown over one of the arms: an open clasp-knife in one hand, and a mass of buttered bread in the other.", highlight: "Noah", author: "Charles Dickens", source: "Oliver Twist, Ch. 42", name: 'Noah' },
  { quote: "There is his home; there lies his business, which a Noah\u2019s flood would not interrupt, though it overwhelmed all the millions in China.", highlight: "Noah", author: "Herman Melville", source: "Moby-Dick, Ch. 1", name: 'Noah' },
  { quote: "Yea, foolish mortals, Noah\u2019s flood is not yet subsided; two thirds of the fair world it yet covers.", highlight: "Noah", author: "Herman Melville", source: "Moby-Dick, Ch. 58", name: 'Noah' },
  { quote: "It is just possible that this hill is Mount Ararat, and that Noah\u2019s Ark rested here, and he ate oysters and threw the shells overboard.", highlight: "Noah", author: "Mark Twain", source: "The Innocents Abroad, Ch. XLII", name: 'Noah' },
  { quote: "Noah\u2019s memorable voyage will always possess a living interest for me, henceforward.", highlight: "Noah", author: "Mark Twain", source: "The Innocents Abroad, Ch. XLII", name: 'Noah' },
  { quote: "Every man on board seemed well content, and they must have been hard to please if they had been otherwise, for it is my belief there was never a ship\u2019s company so spoiled since Noah put to sea.", highlight: "Noah", author: "Robert Louis Stevenson", source: "Treasure Island, Ch. XI", name: 'Noah' },
  { quote: "And thus was Noah, with his family, preserved.", highlight: "Noah", author: "Flavius Josephus", source: "Antiquities of the Jews, Book I", name: 'Noah' },
  { quote: "After this, the ark rested on the top of a certain mountain in Armenia; which, when Noah understood, he opened it; and seeing a small piece of land about it, he continued quiet, and conceived some cheerful hopes of deliverance.", highlight: "Noah", author: "Flavius Josephus", source: "Antiquities of the Jews, Book I", name: 'Noah' },
]
