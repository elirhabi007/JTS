// wilayah-lampung.js
// Daftar kabupaten/kota + kecamatan + desa/kelurahan (sementara fokus Lampung Tengah)

const daftarKotaIndonesia = [
    "Lampung Tengah"
];

// Mapping: nama kota/kabupaten → array kecamatan
const kecamatanLampung = {
    "Lampung Tengah": [
        "Anak Ratu Aji",
        "Anak Tuha",
        "Bandar Mataram",
        "Bandar Surabaya",
        "Bangunrejo",
        "Bekri",
        "Bumi Nabung",
        "Bumi Ratu Nuban",
        "Gunung Sugih",
        "Kalirejo",
        "Kota Gajah",
        "Padang Ratu",
        "Pubian",
        "Punggur",
        "Putra Rumbia",
        "Rumbia",
        "Selagai Lingga",
        "Sendang Agung",
        "Seputih Agung",
        "Seputih Banyak",
        "Seputih Mataram",
        "Seputih Raman",
        "Seputih Surabaya",
        "Terbanggi Besar",
        "Terusan Nunyai",
        "Trimurjo",
        "Way Pengubuan",
        "Way Seputih"
    ]
};

const desaLampung = {
    "Lampung Tengah": {

        "Anak Ratu Aji": [
            "Bandar Putih Tua",
            "Gedung Ratu",
            "Gedung Sari",
            "Karang Jawa",
            "Sri Mulyo",
            "Sukajaya"
        ],

        "Anak Tuha": [
            "Bumi Aji",
            "Bumi Jaya",
            "Gunung Agung",
            "Haji Pemanggilan",
            "Jaya Sakti",
            "Mulyo Haji",
            "Negara Aji Baru",
            "Negara Aji Tua",
            "Negara Bumi Ilir",
            "Negara Bumi Udik",
            "Sri Katon",
            "Tanjung Harapan"
        ],

        "Bandar Mataram": [
            "Jati Datar Mataram",
            "Mataram Jaya",
            "Mataram Udik",
            "Sendang Agung Mataram",
            "Sriwijaya Mataram",
            "Terbanggi Ilir",
            "Terbanggi Mulya",
            "Uman Agung Mataram",
            "Sumber Rejeki Mataram"
        ],

        "Bandar Surabaya": [
            "Beringin Jaya",
            "Cabang",
            "Cempaka Putih",
            "Gaya Baru V",
            "Rajawali",
            "Sidodadi",
            "Subang Jaya",
            "Sumber Agung",
            "Surabaya Ilir",
            "Surabaya Baru"
        ],

        "Bangunrejo": [
            "Bangunrejo",
            "Cimarias",
            "Mekar Jaya",
            "Purwodadi",
            "Sidodadi",
            "Sidoluhur",
            "Sidomulyo",
            "Sidorejo",
            "Sinar Luas",
            "Sinar Seputih",
            "Sri Pendowo",
            "Suka Negeri",
            "Sukanegara",
            "Sukawaringin",
            "Tanjungjaya",
            "Tanjung Pandan",
            "Timbulrejo"
        ],

        "Bekri": [
            "Kedatuan",
            "Binjai Agung",
            "Rengas",
            "Kesumadadi",
            "Goras Jaya",
            "Sinar Banten",
            "Kesuma Jaya",
            "Bangun Sari"
        ],

        "Bumi Nabung": [
            "Bumi Nabung Baru",
            "Bumi Nabung Ilir",
            "Bumi Nabung Selatan",
            "Bumi Nabung Timur",
            "Bumi Nabung Utara",
            "Sri Kenanga",
            "Sri Kencono"
        ],

        "Bumi Ratu Nuban": [
            "Bumi Raharjo",
            "Bumi Rahayu",
            "Bumi Ratu",
            "Bulu Sari",
            "Sidokerto",
            "Sido Waras",
            "Suka Jadi",
            "Suka Jawa",
            "Tulang Kakan",
            "Wates"
        ],

        "Gunung Sugih": [
            "Bangun Rejo",
            "Buyut Ilir",
            "Buyut Udik",
            "Buyut Utara",
            "Fajar Bulan",
            "Gunung Sari",
            "Komering Putih",
            "Putra Buyut",
            "Terbanggi Agung",
            "Terbanggi Subing",
            "Wono Sari",
            "Gunung Sugih",
            "Gunung Sugih Raya",
            "Komering Agung",
            "Seputih Jaya"
        ],

        "Kalirejo": [
            "Agung Timur",
            "Balai Rejo",
            "Kalirejo",
            "Kali Dadi",
            "Kalisari",
            "Kaliwungu",
            "Ponco Warno",
            "Sinar Rejo",
            "Sinar Sari",
            "Sri Basuki",
            "Sri Dadi",
            "Sri Mulyo",
            "Sri Purnomo",
            "Sri Way Langsep",
            "Suko Sari",
            "Watu Agung",
            "Way Krui"
        ],

        "Kota Gajah": [
            "Kota Gajah",
            "Kota Gajah Timur",
            "Nambah Rejo",
            "Purworejo",
            "Sapto Mulyo",
            "Sritejo Kencono",
            "Sumber Rejo"
        ],

        "Padang Ratu": [
            "Bandar Sari",
            "Haduyang Ratu",
            "Karang Sari",
            "Kuripan",
            "Margorejo",
            "Mojokerto",
            "Karang Tanjung",
            "Kota Baru",
            "Padang Ratu",
            "Purworejo",
            "Purwosari",
            "Sendang Ayu",
            "Sri Agung",
            "Sumber Sari",
            "Surabaya"
        ],

        "Pubian": [
            "Gunung Haji",
            "Gunung Raya",
            "Kota Batu",
            "Negeri Kepayungan",
            "Negri Ratu",
            "Padang Rejo",
            "Payung Batu",
            "Payung Dadi",
            "Payung Makmur",
            "Payung Mulya",
            "Payung Rejo",
            "Pekandangan",
            "Riau Priangan",
            "Sangun Ratu",
            "Segala Mider",
            "Sinar Negeri",
            "Tanjung Kemala",
            "Tanjung Rejo",
            "Tias Bangun",
            "Tawang Negeri"
        ],

        "Punggur": [
            "Asto Mulyo",
            "Badran Sari",
            "Mojopahit",
            "Ngesti Rahayu",
            "Nunggal Rejo",
            "Sido Mulyo",
            "Sri Sawahan",
            "Tanggul Angin",
            "Toto Katon"
        ],

        "Putra Rumbia": [
            "Bina Karya Baru",
            "Bina Karya Jaya",
            "Bina Karya Sakti",
            "Bina Karya Utama",
            "Joharan",
            "Mekar Jaya",
            "Mranggi Jaya",
            "Rantau Jaya Baru",
            "Rantau Jaya Ilir",
            "Rantau Jaya Makmur"
        ],

        "Rumbia": [
            "Bina Karya Buana",
            "Bina Karya Mandiri",
            "Bina Karya Putra",
            "Rekso Binangun",
            "Reno Basuki",
            "Restu Baru",
            "Restu Buana",
            "Rukti Basuki",
            "Teluk Dalem Ilir"
        ],

        "Selagai Lingga": [
            "Gedung Aji",
            "Gedung Harta",
            "Gilih Karangjati",
            "Karang Anyar",
            "Linggapura",
            "Marga Jaya",
            "Mekar Harjo",
            "Negeri Jaya",
            "Negeri Agung",
            "Negeri Katon",
            "Nyukang Harjo",
            "Sidoharjo",
            "Taman Sari",
            "Tanjung Ratu"
        ],

        "Sendang Agung": [
            "Kutowinangun",
            "Sendang Agung",
            "Sendang Asih",
            "Sendang Asri",
            "Sendang Baru",
            "Sendang Mukti",
            "Sendang Mulyo",
            "Sendang Rejo",
            "Sendang Retno"
        ],

        "Seputih Agung": [
            "Bumi Kencana",
            "Bumi Mas",
            "Dono Arum",
            "Endang Rejo",
            "Fajar Asri",
            "Gayau Sakti",
            "Harapan Rejo",
            "Muji Rahayu",
            "Simpang Agung",
            "Sulusuban"
        ],

        "Seputih Banyak": [
            "Sanggar Buana",
            "Sakti Buana",
            "Setia Bakti",
            "Setia Budi",
            "Siswo Binangun",
            "Sri Basuki",
            "Sri Bhakti",
            "Sumber Bahagia",
            "Sumber Baru",
            "Sumber Fajar",
            "Swastika Buana",
            "Tanjung Harapan",
            "Tanjung Kerajan"
        ],

        "Seputih Mataram": [
            "Banjar Agung Mataram",
            "Bumi Setia Mataram",
            "Dharma Agung Mataram",
            "Fajar Mataram",
            "Qurnia Mataram",
            "Rejosari Mataram",
            "Subing Karya",
            "Sumber Agung Mataram",
            "Trimulyo Mataram",
            "Utama Jaya Mataram",
            "Varia Agung Mataram",
            "Wirata Agung Mataram"
        ],

        "Seputih Raman": [
            "Buyut Baru",
            "Rama Dewa",
            "Rama Gunawan",
            "Rama Indra",
            "Rama Klandungan",
            "Rama Oetama",
            "Rama Murti",
            "Rama Nirwana",
            "Rama Yana",
            "Ratna Chaton",
            "Rejo Asri",
            "Rejo Basuki",
            "Rukti Endah",
            "Rukti Harjo"
        ],

        "Seputih Surabaya": [
            "Gaya Baru I",
            "Gaya Baru II",
            "Gaya Baru III",
            "Gaya Baru IV",
            "Gaya Baru VI",
            "Gaya Baru VII",
            "Gaya Baru VIII",
            "Kenanga Sari",
            "Mataram Ilir",
            "Rawa Betik",
            "Srikaton",
            "Srimulya Jaya",
            "Sumber Katon"
        ],

        "Terbanggi Besar": [
            "Adi Jaya",
            "Indra Putra Subing",
            "Karang Endah",
            "Nambah Dadi",
            "Ono Harjo",
            "Poncowati",
            "Terbanggi Besar",
            "Bandar Jaya Barat",
            "Bandar Jaya Timur",
            "Yukum Jaya"
        ],

        "Terusan Nunyai": [
            "Bandar Agung",
            "Bandar Sakti",
            "Gunung Agung",
            "Gunung Batin Baru",
            "Gunung Batin Ilir",
            "Gunung Batin Udik",
            "Tanjung Anom"
        ],

        "Trimurjo": [
            "Depok Rejo",
            "Leman Benawi",
            "Notoharjo",
            "Pujoasri",
            "Pujo Basuki",
            "Pujodadi",
            "Pujokerto",
            "Purwoadi",
            "Purwodadi",
            "Tempuran",
            "Untoro",
            "Adipuro",
            "Simbar Waringin",
            "Trimurjo"
        ],

        "Way Pengubuan": [
            "Banjar Kertahayu",
            "Banjar Ratu",
            "Banjar Rejo",
            "Candi Rejo",
            "Lempuyang Bandar",
            "Putra Lempuyang",
            "Purnama Tunggal",
            "Tanjung Ratu Ilir"
        ],

        "Way Seputih": [
            "Sangga Buana",
            "Sri Bawono",
            "Sri Binangun",
            "Sri Budaya",
            "Sri Busono",
            "Suko Binangun"
        ]
    }
};
