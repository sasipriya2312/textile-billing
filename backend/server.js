const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Billing API Running");
});

// SAVE INVOICE
app.post("/invoices", async (req, res) => {
    try {

        console.log(req.body);

        const data = req.body;

        const result = await pool.query(
            `INSERT INTO invoices
            (
                invoice_no,
                dated,
                bill_to,
                bill_gstin,
                taxable,
                cgst_pct,
                cgst_val,
                sgst_pct,
                sgst_val,
                igst_pct,
                igst_val,
                roundoff,
                grand_total,
                amount_words
            )
            VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
            RETURNING id`,
            
                [
    data.invoiceNo || null,
    data.dated || null,
    data.billTo || null,
    data.billGstin || null,

    Number(data.taxable) || 0,
    Number(data.cgstPct) || 0,
    Number(data.cgstVal) || 0,

    Number(data.sgstPct) || 0,
    Number(data.sgstVal) || 0,

    Number(data.igstPct) || 0,
    Number(data.igstVal) || 0,

    Number(data.roundoff) || 0,
    Number(data.grandTotal) || 0,

    data.amountWords || null
]
            
        );

        const invoiceId = result.rows[0].id;

        if (data.items && data.items.length > 0) {

            for (const item of data.items) {

                await pool.query(
    `INSERT INTO invoice_items
    (
        invoice_id,
        sno,
        description,
        hsn,
        qty,
        rate,
        amount
    )
    VALUES
    ($1,$2,$3,$4,$5,$6,$7)`,
    [
        invoiceId,
        Number(item.sno) || 0,
        item.desc || "",
        item.hsn || "",
        Number(item.qty) || 0,
        Number(item.rate) || 0,
        Number(item.amount) || 0
    ]
);
            }

        }

        res.json({
            success: true,
            message: "Invoice Saved Successfully"
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
});

// GET ALL INVOICES
app.get("/invoices", async (req, res) => {

    try {

        const result = await pool.query(
            "SELECT invoice_no FROM invoices ORDER BY id DESC"
        );

        res.json(result.rows);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

});

// GET SINGLE INVOICE
app.get("/invoices/:invoiceNo", async (req, res) => {

    try {

        const invoiceNo = req.params.invoiceNo;

        const invoice = await pool.query(
            "SELECT * FROM invoices WHERE invoice_no=$1",
            [invoiceNo]
        );

        if (invoice.rows.length === 0) {
            return res.status(404).json({
                message: "Invoice Not Found"
            });
        }

        const items = await pool.query(
            "SELECT * FROM invoice_items WHERE invoice_id=$1 ORDER BY sno",
            [invoice.rows[0].id]
        );

        const data = invoice.rows[0];

        data.items = items.rows.map(item => ({
            sno: item.sno,
            desc: item.description,
            hsn: item.hsn,
            qty: item.qty,
            rate: item.rate,
            amount: item.amount
        }));

        res.json(data);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

});

// DELETE INVOICE
app.delete("/invoices/:invoiceNo", async (req, res) => {

    try {

        const invoiceNo = req.params.invoiceNo;

        const invoice = await pool.query(
            "SELECT id FROM invoices WHERE invoice_no=$1",
            [invoiceNo]
        );

        if (invoice.rows.length === 0) {
            return res.status(404).json({
                message: "Invoice Not Found"
            });
        }

        const id = invoice.rows[0].id;

        await pool.query(
            "DELETE FROM invoice_items WHERE invoice_id=$1",
            [id]
        );

        await pool.query(
            "DELETE FROM invoices WHERE id=$1",
            [id]
        );

        res.json({
            success: true,
            message: "Invoice Deleted Successfully"
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

});

app.listen(3000, () => {
    console.log("🚀 Server Running on http://localhost:3000");
});