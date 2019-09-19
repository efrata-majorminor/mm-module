var global = require('../../global');

module.exports = function (spkDocs) {

    var locale = global.config.locale;

    var moment = require('moment');
    moment.locale(locale.name);

    var header = { text: "BON PACKING LIST", style: ['size20', 'bold', 'headerMargin', {}], alignment: 'center' };

    var table1 = [
        // {
        //     columns: [
        //         { width: '30%', text: "No Bon", style: ['size12', 'bold'], alignment: 'left' },
        //         { width: '70%', text: spkDocs.code, style: ['size12'], alignment: 'left' }
        //     ]
        // },
        {
            columns: [
                { width: '30%', text: "No Packing List", style: ['size08', 'bold'], alignment: 'left' },
                { width: '70%', text: spkDocs.packingList, style: ['size08'], alignment: 'left' }
            ]
        },
        {
            columns: [
                { width: '30%', text: "Password", style: ['size08', 'bold'], alignment: 'left' },
                { width: '70%', text: spkDocs.password, style: ['size08'], alignment: 'left' }
            ]
        },
        {
            columns: [
                { width: '30%', text: "Tanggal", style: ['size08', 'bold'], alignment: 'left' },
                { width: '70%', text: `${moment(spkDocs._createdDate).format(locale.date.format)}`, style: ['size08'], alignment: 'left' }
            ]
        }
    ]

    var table2 = [
        {
            columns: [
                { width: '40%', text: "Dari", style: ['size08', 'bold'] },
                { width: '80%', text: spkDocs.source.name, style: ['size08'] }
            ]
        },
        {
            columns: [
                { width: '40%', text: "Tujuan", style: ['size08', 'bold'] },
                { width: '80%', text: spkDocs.destination.name, style: ['size08'] }
            ]
        },
        {
            columns: [
                { width: '40%', text: "Tanggal Kirim", style: ['size08', 'bold'] },
                { width: '80%', text: `${moment(spkDocs.date).format(locale.date.format)}`, style: ['size08'] }
            ]
        },
        {
            columns: [
                { width: '40%', text: "Nomor Referensi", style: ['size08', 'bold'] },
                { width: '80%', text: spkDocs.reference, style: ['size08'] }
            ]
        },
        {
            columns: [
                { width: '40%', text: "Keterangan", style: ['size08', 'bold'] },
                { width: '80%', text: "", style: ['size08'] }
            ]
        }
    ];

    var subHeader = {
        columns: [
            {
                width: "50%",
                stack: [
                    { text: "PT. MAJOR MINOR KREASI NUSANTARA", style: ['size08', 'bold'] },
                    {
                        text: "Kel. Banaran, Kec. Grogol, Kab.Sukoharjo 57193 Jawa Tengah, Indonesia",
                        style: ['size08']
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
        { text: "No", style: ['tableHeader', 'size09'] },
        { text: "Produk", style: ['tableHeader', 'size09'] },
        { text: "Nama Produk", style: ['tableHeader', 'size09'] },
        { text: "Kuantitas", style: ['tableHeader', 'size09'] }
        ,
        { text: "Harga", style: ['tableHeader', 'size09'] }
    ]

    var thead2 = [{
        text: '',
        style: 'tableHeader'
    }, {
        text: 'Yang Membuat',
        style: 'tableHeader'
    }];

    var index = 1;
    var total = 0;
    var totalHarga = 0;
    var tbody = spkDocs.items.map(item => {
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
        style: ['marginTop20', 'size08']
    }

    var data3 = {
        table: {
            headerRows: 0,
            widths: ['56%', '25%', '19%'],
            body: [
                [{ text: 'Total', style: ['bold', 'size08'], alignment: 'center' },
                { text: total, style: ['bold', 'size08'], alignment: 'center' },
                { text: totalHarga.toLocaleString(), style: ['bold', 'size08'], alignment: 'right' }]
            ]
        },
        style: ['marginTop20']
    }

    var tbody2 = [[{
        text: "\n\n\n\n\n",
        style: ['size08', 'center'],
    },
    {
        text: "\n\n\n\n\(________________________________)",
        style: ['size08', 'center'],
    }]];

    var data4 = [{
        table: {
            widths: ['70%', '30%'],
            headerRows: 0,
            body: [].concat([thead2], tbody2)
        },
        style: ['marginTop20','size08']
    }];

    var dd = {
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: 20,
        content: [
            header,
            subHeader,
            data1,
            data2,
            data3,
            data4
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