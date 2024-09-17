
vec3 sample_hemisphere()
{
	// Algo echantillonnage uniforme hemisphere:
	// Z <- rand entre ? et ?
	// beta <- Z : angle/plan_xy
	// alpha <- rand entre ? et ?
	// x,y,z <- alpha,beta : coord polaire -> cartesienne

	// fake !!!!!!
	return normalize(random_vec3());
}

// D direction principale de l'hemisphere, normalisée
vec3 random_ray(in vec3 D)
{
	// Algo orientation échantillon
	// choisir un W normalisé non colineaire à D
	// U orthogonal à D et W
	// V tq U,V,D repère ortho-normé direct
	// mettre  U,V,D dans une  matrice 3x3 de changement de repère M
	// multiplier votre echantillon par M pour bien l'orienter
	// ici par de matrice 4x4 car pas de translation
	return sample_hemisphere();
}


void main()
{
	// param de srand le nombre de random_float appelé dans le shader
	srand(3u);
	vec3 P = random_ray(normalize(normal));
	gl_Position = pvMatrix * vec4(P,1);
}