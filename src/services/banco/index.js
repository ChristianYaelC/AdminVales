import { supabase } from '../../lib/supabaseClient'
import { deleteClientById } from '../valesSupabaseService'

export async function createBancoClient({ name, phone, address, workAddress }) {
	const { data, error } = await supabase
		.from('clients')
		.insert({
			area: 'banco',
			name: name.trim(),
			phone: phone?.trim() || null,
			address: address?.trim() || null,
			work_address: workAddress?.trim() || null
		})
		.select()
		.single()

	if (error) throw error
	return data
}

export const bancoService = {
	createBancoClient,
	deleteClientById
}
