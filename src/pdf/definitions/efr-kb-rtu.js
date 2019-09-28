var global = require('../../global');

module.exports = function (rtu, spkDoc) {

    var locale = global.config.locale;

    var moment = require('moment');
    moment.locale(locale.name);

    var header = { text: "BON RETUR BARANG", style: ['size20', 'bold', 'headerMargin', {}], alignment: 'center' };

    var table1 = [
        {
            columns: [
                { width: '30%', text: "No Packing List", style: ['size12', 'bold'], alignment: 'left' },
                { width: '70%', text: spkDoc.packingList, style: ['size12'], alignment: 'left' }
            ]
        },
        {
            columns: [
                { width: '30%', text: "Password", style: ['size12', 'bold'], alignment: 'left' },
                { width: '70%', text: spkDoc.password, style: ['size12'], alignment: 'left' }
            ]
        },
        {
            columns: [
                { width: '30%', text: "Tanggal", style: ['size12', 'bold'], alignment: 'left' },
                { width: '70%', text: `${moment(rtu._createdDate).format(locale.date.format)}`, style: ['size12'], alignment: 'left' }
            ]
        }
    ]

    var table2 = [
        {
            columns: [
                { width: '40%', text: "Dari", style: ['size12', 'bold'] },
                { width: '80%', text: rtu.source.name, style: ['size12'] }
            ]
        },
        {
            columns: [
                { width: '40%', text: "Tujuan", style: ['size12', 'bold'] },
                { width: '80%', text: rtu.destination.name, style: ['size12'] }
            ]
        }
    ];

    var subHeader = {
        columns: [
            {
                width: "50%",
                stack: [
                    { text: "PT. MAJOR MINOR KREASI NUSANTARA", style: ['size12', 'bold'] },
                    {
                        text: "Equity Tower 15th Floor Suite C, SCBD Lot 9, Jl. Jenderal Sudirman Kav 52-53 Jakarta 12190, Indonesia",
                        style: ['size12']
                    }
                ]
            },
            {
                width: "50%",
                columns: [
                    {
                        width: '20%',
                        text: ''
                    },
                    {
                        width: '80%',
                        stack: table1,
                    }
                ],
                alignment: 'right'
            }
        ],
        style: ['marginTop20']
    };

    var thead = [
        { text: "No", style: 'tableHeader' },
        { text: "Produk", style: 'tableHeader' },
        { text: "Nama Produk", style: 'tableHeader' },
        { text: "Kuantitas", style: 'tableHeader' }
        ,
        { text: "Harga", style: 'tableHeader' }
    ]

    var index = 1;
    var total = 0;
    var totalHarga = 0;
    var tbody = rtu.items.map(item => {
        var harga = 0;
        total += parseInt(item.quantity);
        harga = parseInt(item.quantity) * parseInt(item.item.domesticSale);
        totalHarga += harga;
        return [
            { text: index++, alignment: 'center' },
            { text: item.item.code, alignment: 'center' },
            { text: item.item.name || 0, alignment: 'center' },
            { text: item.quantity || 0, alignment: 'center' },
            { text: harga.toLocaleString() || 0, alignment: 'right' }
        ]
    });

    var data1 = {
        columns: [{ width: '50%', stack: table2, style: ['marginTop20'] }],
    }

    var data2 = {
        table: {
            headerRows: 1,
            widths: ['10%', '20%', '25%', '25%', '20%'],
            body: [].concat([thead], tbody)
        },
        style: ['marginTop20']
    }

    var data3 = {
        table: {
            headerRows: 0,
            widths: ['56%', '25%', '19%'],
            body: [
                [{ text: 'Total', style: ['bold', 'size12'], alignment: 'center' },
                { text: total, style: ['bold', 'size12'], alignment: 'center' },
                { text: totalHarga.toLocaleString(), style: ['bold', 'size12'], alignment: 'right' }]
            ]
        },
        style: ['marginTop20']
    }

    var dd = {
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: 20,
        content: [
            header,
            subHeader,
            data1,
            data2,
            data3
        ],
        styles: {
            size06: {
                fontSize: 6
            },
            size07: {
                fontSize: 7
            },
            size08: {
                fontSize: 8
            },
            size09: {
                fontSize: 9
            },
            size10: {
                fontSize: 10
            },
            size12: {
                fontSize: 12
            },
            size15: {
                fontSize: 15
            },
            size20: {
                fontSize: 20
            },
            bold: {
                bold: true
            },
            center: {
                alignment: 'center'
            },
            left: {
                alignment: 'left'
            },
            right: {
                alignment: 'right'
            },
            justify: {
                alignment: 'justify'
            },
            tableHeader: {
                bold: true,
                fontSize: 12,
                color: 'black',
                alignment: 'center'
            },
            marginTop20: {
                margin: [0, 20, 0, 0]
            },
            noBorder: {
                border: 0
            }
        }
    };

    return dd;
}