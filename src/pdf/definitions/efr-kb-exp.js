var global = require('../../global');

module.exports = function (expeditions) {

    var locale = global.config.locale;

    var moment = require('moment');
    moment.locale(locale.name);

    var header = { text: "BON PENGELUARAN BARANG", style: ['size20', 'bold', 'headerMargin', {}], alignment: 'center' };

    var table1 = [
        {
            columns: [
                { width: '30%', text: "No Bon", style: ['size08', 'bold'], alignment: 'left' },
                { width: '70%', text: expeditions.code, style: ['size08'], alignment: 'left' }
            ]
        },
        {
            columns: [
                { width: '30%', text: "Tanggal", style: ['size08', 'bold'], alignment: 'left' },
                { width: '70%', text: `${moment(expeditions._createdDate).format(locale.date.format)}`, style: ['size08'], alignment: 'left' }
            ]
        }
    ]

    var table2 = [
        {
            columns: [
                { width: '40%', text: "Tujuan", style: ['size08', 'bold'] },
                { width: '60%', text: expeditions.spkDocuments[0].destination.name || "", style: ['size08'] }
            ]
        },
        {
            columns: [
                { width: '40%', text: "Ekspedisi", style: ['size08', 'bold'] },
                { width: '60%', text: expeditions.expedition.name || expeditions.expedition, style: ['size08'] }
            ]
        },
        {
            columns: [
                { width: '40%', text: "Total Berat (Kg)", style: ['size08', 'bold'] },
                { width: '60%', text: expeditions.weight, style: ['size08'] }
            ]
        }
    ];

    var subHeader = {
        columns: [
            {
                width: "50%",
                stack: [
                    { text: "PT EFRATA RETAILINDO", style: ['size08', 'bold'] },
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
        { text: "Packing List", style: ['tableHeader', 'size09'] },
        { text: "Password", style: ['tableHeader', 'size09']},
        { text: "Berat (Kg)", style: ['tableHeader', 'size09'] },
        { text: "Total Barang", style: ['tableHeader', 'size09'] }
    ]

    var thead2 = [{
        text: 'Penerima/Pembeli',
        style: 'tableHeader'
    }, {
        text: 'Bagian Pengiriman',
        style: 'tableHeader'
    }, {
        text: 'Petugas Gudang',
        style: 'tableHeader'
    }];

    var index = 1;
    var total = 0;

    var spkDocuments = [];

    for (var spkDocument of expeditions.spkDocuments ) {
        if (spkDocument.code !== "") {
            spkDocuments.push(spkDocument);
        }
    }

    var tbody = spkDocuments.map(item => {
        var totalBarang = 0;
        if (item.items.length > 1) {
            totalBarang = item.items.reduce((acc, currValue, currIndex, quantities) => {return acc + parseInt(currValue.quantity)}, 0);
        } else {
            totalBarang = parseInt(item.items[0].quantity);
        }
        total += totalBarang;
        return [
            { text: index++, alignment: 'center' },
            { text: item.packingList, alignment: 'center' },
            { text: item.password, alignment: 'center'},
            { text: item.weight || 0, alignment: 'center' },
            { text: totalBarang || 0, alignment: 'center' }
        ]
    });

    var data1 = {
        columns: [{ width: '50%', stack: table2, style: ['marginTop20'] }],
    }

    var data2 = {
        table: {
            headerRows: 1,
            widths: ['5%', '45%', '30%', '10%', '10%'],
            body: [].concat([thead], tbody)
        },
        style: ['marginTop20', 'size08']
    }

    var data3 = {
        table: {
            headerRows: 0,
            widths: ['75%', '25%'],
            body: [
                [{ text: 'Total', style: ['bold', 'size08'], alignment: 'center' },
                { text: total, style: ['bold', 'size08'], alignment: 'center' }]
            ]
        },
        style: ['marginTop20']
    }

    var tbody2 = [[{
        text: "\n\n\n\n\n",
        style: ['size08', 'center'],
    }, " ", " "]];

    var data4 = [{
        table: {
            widths: ['30%', '40%', '30%'],
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