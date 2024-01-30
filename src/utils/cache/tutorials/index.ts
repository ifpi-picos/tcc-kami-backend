import fs from 'fs'
import path from 'path'
import stringSimlarity from 'string-similarity'
import db from '../../../config/database'

class Tutorials_Cache {
    private db: Db
    readonly jsonPath: string
    constructor(db: Db) {
        this.db = db
        this.jsonPath = path.join(__dirname, 'json', 'tutorials.json')

        this.updateCache()
        setInterval(() => {
            this.updateCache()
        }, 1000 * 60 * 60)
    }

    updateCache() {
        this.db.tutorials.findMany().then(tutorials => {
            try {
                fs.mkdirSync(path.join(__dirname, 'json'))
            } catch (err: any) {
                if (err.code != 'EEXIST') {
                    throw err
                }
            }
            fs.writeFileSync(this.jsonPath, JSON.stringify(tutorials), { flag: 'w+' })
        })
    }

    getAllTutorials() {
        const tutorials: Tutorial[] = require(this.jsonPath)

        return tutorials
    }

    getTutorial(link: string) {
        const tutorials: Tutorial[] = require(this.jsonPath)

        for (const tutorial of tutorials) {
            if (tutorial.link === link) {
                return tutorial
            }
        }

        return false
    }

    private prepareString(string: string) {
        return string
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[`~@$%^&*()_|\-=?;:'",.<>{}[\]\\/]/gi, '')
    }

    searchTutorials(search: string) {
        const tutorials: Tutorial[] = require(this.jsonPath)

        const matches = []
        search = this.prepareString(search)

        for (const tutorial of tutorials) {
            const titleRating = stringSimlarity.compareTwoStrings(search, this.prepareString(tutorial.title))
            const descriptonRating = stringSimlarity.compareTwoStrings(search, this.prepareString(tutorial.title))
            const tagsRatings = []

            for (const searchTerm of search.split(' ')) {
                if (searchTerm.length > 2) {
                    const tagsResult = stringSimlarity.findBestMatch(searchTerm, tutorial.tags)

                    if (tagsResult.bestMatch.rating >= 0.4) {
                        tagsRatings.push(tagsResult.bestMatch.rating)
                    }
                }
            }

            let overallMatch = titleRating + descriptonRating

            let tagsOverallRating = 0
            tagsRatings.forEach(tagRating => {
                tagsOverallRating += tagRating
            })

            tagsOverallRating = (tagsOverallRating / tagsRatings.length) * 1.5 || 0
            overallMatch = (overallMatch + tagsOverallRating) / 3

            // console.table({
            //     name: tutorial.title,
            //     titleRating: titleRating,
            //     descriptonRating: descriptonRating,
            //     tagsRatings: tagsOverallRating,
            //     overallMatch: overallMatch,
            // })

            if (overallMatch >= 0.6 || titleRating >= 0.6 || descriptonRating >= 0.6 || tagsOverallRating >= 0.6) {
                matches.push({ tutorial: tutorial, rating: overallMatch })
            }
        }

        matches.sort((a: any, b: any) => {
            return b.rating - a.rating
        })

        const sortedMatches: Array<object> = []
        matches.forEach(match => {
            sortedMatches.push(match.tutorial)
        })

        return sortedMatches
    }
}

const tutorialsCache = new Tutorials_Cache(db)

export default tutorialsCache
