import { z } from "zod";

// Letters-only public IDs need slightly more length than base36 to keep similar entropy.
export const PUBLIC_ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz";
export const PUBLIC_ID_LENGTH = 27;

export const publicIdSchema = z
	.string()
	.regex(new RegExp(`^[a-z]{${PUBLIC_ID_LENGTH}}$`), "Invalid public id format");

