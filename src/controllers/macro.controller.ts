type PreparedMacro = {
    user_id: number
    macro_name: Macro_Name
    is_public: boolean
    macros: {}
}

type PreparedMacroUpdate = {
    macro_name: Macro_Name
    is_public: boolean
    macros: {}
}

function toMacro(macro: any): Macro | null {
    try {
        return {
            id: macro.id,
            user_id: macro.user_id,
            macro_name: macro.macro_name,
            macros: macro.macros,
            is_public: macro.is_public,
            last_use: macro.last_use,
        }
    } catch (err) {
        return null
    }
}

function toMacroArray(macros: any[]): Macro[] | null {
    try {
        return macros.map(macro => {
            return {
                id: macro.id,
                user_id: macro.user_id,
                macro_name: macro.macro_name,
                macros: macro.macros,
                is_public: macro.is_public,
                last_use: macro.last_use,
            }
        })
    } catch (err) {
        return null
    }
}

function toMacroHeadArray(macros: any[]): Macro_Head[] | null {
    try {
        return macros.map(macro => {
            return {
                id: macro.id,
                user_id: macro.user_id,
                sheet_id: macro.sheet_id,
                macro_name: macro.macro_name,
            }
        })
    } catch (err) {
        return null
    }
}

export default class MacroController {
    private db: Db
    constructor(db: Db) {
        this.db = db
    }

    async create(macro: PreparedMacro): Promise<Macro | null> {
        return toMacro(
            await this.db.macros.create({
                data: {
                    user_id: macro.user_id,
                    macro_name: macro.macro_name.macro_name,
                    macros: macro.macros,
                    is_public: macro.is_public,
                },
            }),
        )
    }

    async getById(id: number): Promise<Macro | null> {
        return toMacro(
            await this.db.macros.findUnique({
                where: {
                    id: id,
                },
            }),
        )
    }

    async getByUserId(userId: number): Promise<Macro_Head[] | null> {
        return toMacroHeadArray(
            await this.db.macros.findMany({
                where: {
                    user_id: userId,
                },
                select: {
                    id: true,
                    user_id: true,
                    macro_name: true,
                },
            }),
        )
    }

    async getByUserIdAndMacroName(userId: number, macroName: string): Promise<Macro | null> {
        return toMacro(
            await this.db.macros.findFirst({
                where: {
                    user_id: userId,
                    macro_name: macroName,
                },
            }),
        )
    }

    async getAllByUserId(userId: number): Promise<Macro[] | null> {
        return toMacroArray(
            await this.db.macros.findMany({
                where: {
                    user_id: userId,
                },
            }),
        )
    }

    async updateById(id: number, macro: PreparedMacroUpdate): Promise<Macro | null> {
        return toMacro(
            await this.db.macros.update({
                where: {
                    id: id,
                },
                data: {
                    macro_name: `${macro.macro_name}`,
                    macros: macro.macros,
                    is_public: macro.is_public,
                },
            }),
        )
    }

    async deleteById(id: number): Promise<Macro | null> {
        return toMacro(
            await this.db.macros.delete({
                where: {
                    id: id,
                },
            }),
        )
    }
}
