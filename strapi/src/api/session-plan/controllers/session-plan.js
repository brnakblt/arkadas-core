'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const ExcelJS = require('exceljs');

module.exports = createCoreController('api::session-plan.session-plan', ({ strapi }) => ({
    async exportExcel(ctx) {
        const { date } = ctx.query;
        if (!date) return ctx.badRequest('Date is required');

        const startOfWeek = new Date(date);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        const sessions = await strapi.entityService.findMany('api::session-plan.session-plan', {
            filters: {
                startTime: { $gte: startOfWeek.toISOString(), $lt: endOfWeek.toISOString() },
                status: { $ne: 'CANCELLED' }
            },
            populate: ['student', 'teacher', 'classroom']
        });

        const classrooms = await strapi.entityService.findMany('api::classroom.classroom', {
            sort: { name: 'asc' }
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Haftalık Plan');

        // Styles
        const headerStyle = {
            font: { bold: true, color: { argb: 'FFFFFFFF' } },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } },
            alignment: { horizontal: 'center', vertical: 'middle' }
        };

        // 1. Build Header Row (Classrooms)
        const columns = [{ header: 'Saat', key: 'time', width: 10 }];
        classrooms.forEach(room => {
            columns.push({ header: room.name, key: `room_${room.id}`, width: 25 });
        });
        worksheet.columns = columns;
        worksheet.getRow(1).eachCell(cell => cell.style = headerStyle);

        // 2. Build Hours Rows (08:00 to 19:00)
        for (let h = 8; h < 20; h++) {
            const hourStr = `${h.toString().padStart(2, '0')}:00`;
            const rowData = { time: hourStr };
            
            classrooms.forEach(room => {
                const session = sessions.find(s => 
                    s.classroom?.id === room.id && 
                    new Date(s.startTime).getHours() === h
                );
                if (session) {
                    rowData[`room_${room.id}`] = `${session.student?.fullName}\n(${session.teacher?.fullName})`;
                }
            });

            const row = worksheet.addRow(rowData);
            row.height = 40;
            row.eachCell(cell => {
                cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
                if (cell.value && cell.address !== `A${row.number}`) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
                }
            });
        }

        ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        ctx.set('Content-Disposition', `attachment; filename="haftalik-plan-${date}.xlsx"`);
        
        ctx.body = await workbook.xlsx.writeBuffer();
    }
}));
