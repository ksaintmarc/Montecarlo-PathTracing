
layout(location=20) uniform int nb_emissives;
layout(location=21) uniform int NB_BOUNCES;

vec3 random_path(in vec3 D, in vec3 O)
{
	traverse_all_bvh(O,D);

	if (!hit())
		return vec3(0,0,0.2) ;
	vec3 N;
	vec3 P;
	intersection_info(N,P);
	vec4 mat = intersection_mat_info();
	vec4 col = intersection_color_info();

	//...
	//...
	return col.rgb*random_float(); //fake
}

vec3 raytrace(in vec3 Dir, in vec3 Orig)   
{
	// init de la graine du random
	srand();
	// calcul de la lumière captée par un chemin aléatoire
	return random_path(normalize(Dir),Orig);
}

