-- The size now lives in the unit field, so the Nepali names no longer repeat it ("चामल ५ केजी" -> "चामल").
update items set name_ne = 'बियर'        where name = 'Beer'           and name_ne = 'बियर ६५० एमएल';
update items set name_ne = 'चकलेट केक'   where name = 'Chocolate Cake' and name_ne = 'चकलेट केक १ पाउन्ड';
update items set name_ne = 'चामल'        where name = 'Rice'           and name_ne = 'चामल ५ केजी';
update items set name_ne = 'गोलभेडा'     where name = 'Tomato'         and name_ne = 'गोलभेडा १ केजी';
