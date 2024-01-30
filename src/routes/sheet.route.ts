import { Router, Request, Response } from 'express'
import db from '../config/database'
import SheetController from '../controllers/sheet.controller'
import logger from '../config/logger'
import SheetServices from '../services/sheet.services'
import { Discord_Id } from '../types/validations'
import { default as Events } from '../websocket/events'

const router = Router()
const sheetController = new SheetController(db)
const sheetServices = new SheetServices()

router.get('/one', async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            req.user = { id: 0, discord_id: new Discord_Id('000000000000000000'), username: '', avatar_url: '', is_beta: false, is_premium: false }
        }

        if (req.query.id) {
            const sheet = await sheetController.getById(Number(req.query.id))

            if (sheet) {
                if (sheet.user_id === req.user.id || sheet.is_public === true) {
                    sheet.user = req.user

                    if (sheet.user_id !== req.user.id) {
                        //@ts-expect-error
                        delete sheet.sheet_password
                    }

                    res.status(200).json({ sheet: sheet })
                } else {
                    res.status(403).json({ error: 'Forbidden' })
                }
            } else {
                res.status(404).json({ error: 'Sheet not found' })
            }
        } else if (req.query.userId && req.query.sheetName) {
            const sheet = await sheetController.getByUserIdAndSheetName(Number(req.query.userId), req.query.sheetName.toString())

            if (sheet) {
                if (sheet.user_id === req.user.id || sheet.is_public === true) {
                    sheet.user = req.user

                    if (sheet.user_id !== req.user.id) {
                        //@ts-expect-error
                        delete sheet.sheet_password
                    }

                    res.status(200).json({ sheet: sheet })
                } else {
                    res.status(403).json({ error: 'Forbidden' })
                }
            } else {
                res.status(404).json({ error: 'Sheet not found' })
            }
        } else if (req.query.username && req.query.sheetName) {
            const sheet = await sheetController.getByUsernameAndSheetName(req.query.username.toString(), req.query.sheetName.toString())

            if (sheet) {
                if (sheet.user_id === req.user.id || sheet.is_public === true) {
                    sheet.user = req.user

                    if (sheet.user_id !== req.user.id) {
                        //@ts-expect-error
                        delete sheet.sheet_password
                    }

                    res.status(200).json({ sheet: sheet })
                } else {
                    res.status(403).json({ error: 'Forbidden' })
                }
            } else {
                res.status(404).json({ error: 'Sheet not found' })
            }
        } else {
            res.status(400).json({ error: 'Missing parameters' })
        }
    } catch (err) {
        logger.registerError(err)
        res.status(500).end()
    }
})

router.get('/all', async (req: Request, res: Response) => {
    try {
        if (req.user) {
            const sheets = await sheetController.getByUserId(Number(req.user.id))

            if (sheets && sheets.length > 0) {
                res.status(200).json({ sheets: sheets })
            } else {
                res.status(404).json({ error: 'Sheets not found' })
            }
        } else {
            res.status(401).json({ title: 'Unathorized', message: 'Invalid token' })
        }
    } catch (err) {
        logger.registerError(err)
        res.status(500).end()
    }
})

router.post('/create', async (req: Request, res: Response) => {
    try {
        if (req.user) {
            if (req.body.sheetName) {
                req.body.user_id = req.user.id
                const validationErrors = await sheetServices.validate(req.body)

                if (validationErrors.length > 0) {
                    res.status(400).json({ errors: validationErrors })
                } else {
                    const preparedSheet = await sheetServices.prepareSheet(req.body, req.user.id)

                    const sheet = await sheetController.create(preparedSheet)

                    if (sheet) {
                        res.status(201).json({ sheet: sheet })
                    } else {
                        res.status(500).json({ error: 'Internal server error' })
                    }
                }
            } else {
                res.status(400).json({ error: 'Missing parameters' })
            }
        } else {
            res.status(401).json({ title: 'Unathorized', message: 'Invalid token' })
        }
    } catch (err) {
        logger.registerError(err)
        res.status(500).end()
    }
})

router.put('/update', async (req: Request, res: Response) => {
    try {
        if (req.user) {
            if (req.body.user_id === req.user.id) {
                const validationErrors = await sheetServices.validateUpdate(req.body)

                if (validationErrors.length > 0) {
                    res.status(400).json({ errors: validationErrors })
                } else {
                    const preparedSheet = await sheetServices.prepareSheetUpdate(req.body)

                    const sheet = await sheetController.updateById(Number(req.body.id), preparedSheet)

                    if (sheet) {
                        Events.emit('sheet-updated', req.body.socketIdentifier, sheet)
                        res.status(200).json({ sheet: sheet })
                    } else {
                        res.status(500).json({ error: 'Internal server error' })
                    }
                }
            } else {
                res.status(400).json({ error: 'Missing parameters' })
            }
        } else {
            res.status(401).json({ title: 'Unathorized', message: 'Invalid token' })
        }
    } catch (err) {
        logger.registerError(err)
        res.status(500).end()
    }
})

router.delete('/delete', async (req: Request, res: Response) => {
    try {
        if (req.user) {
            if (req.query.id) {
                const sheet = await sheetController.getById(Number(req.query.id))

                if (sheet) {
                    if (sheet.user_id === req.user.id) {
                        const deletedSheet = await sheetController.deleteById(Number(req.query.id))

                        if (deletedSheet) {
                            Events.emit('sheet-deleted', deletedSheet.id)
                            res.status(200).json({ sheet: deletedSheet })
                        } else {
                            res.status(500).json({ error: 'Internal server error' })
                        }
                    } else {
                        res.status(403).json({ error: 'Forbidden' })
                    }
                } else {
                    res.status(404).json({ error: 'Sheet not found' })
                }
            } else {
                res.status(400).json({ error: 'Missing parameters' })
            }
        } else {
            res.status(401).json({ title: 'Unathorized', message: 'Invalid token' })
        }
    } catch (err) {
        logger.registerError(err)
        res.status(500).end()
    }
})

export default router
